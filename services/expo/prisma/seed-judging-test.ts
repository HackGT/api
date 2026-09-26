/**
 * Judging algorithm test seed — creates projects across multiple rooms and tracks.
 *
 * Run with:
 *   cd services/expo
 *   POSTGRES_URI_EXPO_SERVICE="postgres://postgres@localhost/expo" \
 *   ../../node_modules/.bin/ts-node prisma/seed-judging-test.ts
 */

import { PrismaClient } from "./generated";
import { MongoClient } from "mongodb";
import { writeFileSync } from "fs";
import { resolve } from "path";

const CONFIG_OUT = resolve(__dirname, "../../../../timber/judging-test-config.json");
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const HEXATHON_SHORT_CODE = process.env.HEXATHON_SHORT_CODE ?? "test";

const prisma = new PrismaClient();

// ── Config ────────────────────────────────────────────────────────────────

// Categories grouped by sponsor
const CATEGORY_GROUPS: {
  sponsor: string;
  isSponsor: boolean;
  judgeCount: number;
  categories: string[];
}[] = [
  {
    sponsor: "General",
    isSponsor: false,
    judgeCount: 100,
    categories: [
      "General - Oracle of the Deep",
      "General - Hardware Track",
      "General - Immersive (AR/VR/XR) Track",
    ],
  },
  {
    sponsor: "Aramco",
    isSponsor: true,
    judgeCount: 10,
    categories: [
      "Aramco - A Marina's Mission",
    ],
  },
  {
    sponsor: "NSA",
    isSponsor: true,
    judgeCount: 10,
    categories: [
      "NSA - HEARSAY: The Audio Authentication Challenge",
      "NSA - Packet Pursuit",
      "NSA - Codebreaker Challenge",
    ],
  },
  {
    sponsor: "Impiricus",
    isSponsor: true,
    judgeCount: 10,
    categories: [
      "Impiricus - Invent the next way we engage HCPs",
    ],
  },
  {
    sponsor: "VISA",
    isSponsor: true,
    judgeCount: 7,
    categories: [
      "VISA - Reimagine Shopping – Use generative AI to craft smarter and effortless commerce experiences.",
    ],
  },
  {
    sponsor: "Meta",
    isSponsor: true,
    judgeCount: 6,
    categories: [
      "Meta - Bringing People Closer Together with AI",
    ],
  },
  {
    sponsor: "SpaceXAI",
    isSponsor: true,
    judgeCount: 2,
    categories: [
      "SpaceXAI - Make it Legendary with SpaceXAI",
    ],
  },
  {
    sponsor: "Notability",
    isSponsor: true,
    judgeCount: 2,
    categories: [
      'Notability - "Trust the Process" (Best Use of Notability)',
    ],
  },
];

const ROOMS = [
  { name: "Klaus Atrium",    shortCode: "ATRIUM", color: "Blue",   capacity: 70, projectCount: 60 },
  { name: "Klaus 1116",      shortCode: "1116",   color: "Green",  capacity: 50, projectCount: 45 },
  { name: "Klaus 2nd Floor", shortCode: "2FL",    color: "Orange", capacity: 40, projectCount: 35 },
  { name: "Klaus 1456",      shortCode: "1456",   color: "Purple", capacity: 35, projectCount: 30 },
  { name: "Exhibition Hall",  shortCode: "EXHIB",  color: "Red",    capacity: 40, projectCount: 30 },
];

// Each project gets all General categories, plus 1-2 random sponsor categories
const SPONSOR_CATS_PER_PROJECT = { min: 1, max: 2 };

// ── Seed ──────────────────────────────────────────────────────────────────

async function main() {
  // Resolve hexathon ID
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const hexathon = await mongo.db("hexathons").collection("hexathons").findOne({ shortCode: HEXATHON_SHORT_CODE });
  await mongo.close();

  if (!hexathon) {
    throw new Error(`No hexathon found with shortCode "${HEXATHON_SHORT_CODE}".`);
  }
  const HEXATHON_ID = hexathon._id.toString();
  console.log(`Using hexathon: "${hexathon.name}" (${HEXATHON_ID})\n`);

  // ── Wipe existing data ──────────────────────────────────────────────────
  console.log("Clearing existing data...");
  await prisma.judgingSession.deleteMany({});
  await prisma.ballot.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.categoryGroup.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.criteria.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tableGroup.deleteMany({});
  console.log("Cleared.\n");

  // ── Create all categories ───────────────────────────────────────────────
  console.log("Creating categories...");
  // categoryName → categoryId
  const categoryMap = new Map<string, number>();

  for (const group of CATEGORY_GROUPS) {
    for (const catName of group.categories) {
      const cat = await prisma.category.create({
        data: {
          name: catName,
          isDefault: false,
          description: catName,
          hexathon: HEXATHON_ID,
          criterias: {
            create: [
              { name: "Innovation", description: "How innovative?", minScore: 1, maxScore: 10 },
              { name: "Technical", description: "Technical complexity?", minScore: 1, maxScore: 10 },
              { name: "Impact", description: "Potential impact?", minScore: 1, maxScore: 10 },
            ],
          },
        },
      });
      categoryMap.set(catName, cat.id);
      console.log(`  ${catName} → category ${cat.id}`);
    }
  }

  // ── Create category groups + judges ─────────────────────────────────────
  console.log("\nCreating category groups and judges...");

  // sponsorName → list of category IDs (for project assignment later)
  const sponsorCategoryIds = new Map<string, number[]>();
  // For k6 config: { judgeId, criteriaIds[] }[]
  const judgeConfigs: { judgeId: number; criteriaIds: number[] }[] = [];

  for (const group of CATEGORY_GROUPS) {
    const catIds = group.categories.map(name => categoryMap.get(name)!);
    sponsorCategoryIds.set(group.sponsor, catIds);

    // Get criteria IDs for this group's categories
    const criterias = await prisma.criteria.findMany({
      where: { categoryId: { in: catIds } },
      select: { id: true },
    });
    const criteriaIds = criterias.map(c => c.id);

    const cg = await prisma.categoryGroup.create({
      data: {
        name: `${group.sponsor} Judges`,
        hexathon: HEXATHON_ID,
        isSponsor: group.isSponsor,
        categories: { connect: catIds.map(id => ({ id })) },
      },
    });
    console.log(`  ${cg.name} (group ${cg.id}) — ${catIds.length} categories, ${criteriaIds.length} criteria`);

    const slug = group.sponsor.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (let i = 0; i < group.judgeCount; i++) {
      const num = String(i + 1).padStart(3, "0");
      const judge = await prisma.user.create({
        data: {
          name: `${group.sponsor} Judge ${num}`,
          email: `${slug}-judge-${num}@test.dev`,
          userId: `test-${slug}-judge-${num}`,
          categoryGroups: { connect: [{ id: cg.id }] },
        },
      });
      judgeConfigs.push({ judgeId: judge.id, criteriaIds });
    }
    console.log(`    Created ${group.judgeCount} judges`);
  }

  // ── Create table groups (rooms) ─────────────────────────────────────────
  console.log("\nCreating rooms...");
  const tableGroupMap = new Map<string, number>();

  for (const room of ROOMS) {
    const tg = await prisma.tableGroup.create({
      data: {
        name: room.name,
        shortCode: room.shortCode,
        color: room.color,
        hexathon: HEXATHON_ID,
        tableCapacity: room.capacity,
      },
    });
    tableGroupMap.set(room.name, tg.id);
    console.log(`  ${room.name} → tableGroup ${tg.id}`);
  }

  // ── Create projects ─────────────────────────────────────────────────────
  console.log("\nCreating projects...");

  const generalCatIds = sponsorCategoryIds.get("General")!;
  const sponsorGroups = CATEGORY_GROUPS.filter(g => g.isSponsor);
  // Flatten all sponsor category IDs for random picking
  const allSponsorCatIds = sponsorGroups.flatMap(g => sponsorCategoryIds.get(g.sponsor)!);

  let projectIdx = 0;

  for (const room of ROOMS) {
    const tgId = tableGroupMap.get(room.name)!;

    for (let i = 0; i < room.projectCount; i++) {
      // Every project gets all General categories
      const projectCatIds = new Set(generalCatIds);

      // Randomly pick 1-2 sponsor categories
      const shuffled = [...allSponsorCatIds].sort(() => Math.random() - 0.5);
      const numSponsor = SPONSOR_CATS_PER_PROJECT.min +
        Math.floor(Math.random() * (SPONSOR_CATS_PER_PROJECT.max - SPONSOR_CATS_PER_PROJECT.min + 1));

      for (let s = 0; s < numSponsor && s < shuffled.length; s++) {
        projectCatIds.add(shuffled[s]);
      }

      await prisma.project.create({
        data: {
          name: `Project ${projectIdx + 1}`,
          description: `Test project in ${room.name}`,
          githubUrl: `https://github.com/test/project-${projectIdx + 1}`,
          hexathon: HEXATHON_ID,
          expo: 1,
          round: 1,
          table: i + 1,
          tableGroup: { connect: { id: tgId } },
          categories: { connect: [...projectCatIds].map(id => ({ id })) },
        },
      });
      projectIdx++;
    }
    console.log(`  ${room.name}: ${room.projectCount} projects`);
  }

  // ── Update config ───────────────────────────────────────────────────────
  await prisma.config.upsert({
    where: { id: 1 },
    update: {
      currentHexathon: HEXATHON_ID,
      currentExpo: 1,
      currentRound: 1,
      isJudgingOn: false,
    },
    create: {
      currentHexathon: HEXATHON_ID,
      currentExpo: 1,
      currentRound: 1,
      isJudgingOn: false,
    },
  });

  // ── Write k6 config ──────────────────────────────────────────────────────
  writeFileSync(CONFIG_OUT, JSON.stringify({ judges: judgeConfigs }, null, 2));
  console.log(`\nk6 config written to: ${CONFIG_OUT}`);

  // ── Summary ─────────────────────────────────────────────────────────────
  const totalProjects = ROOMS.reduce((sum, r) => sum + r.projectCount, 0);
  const totalJudges = CATEGORY_GROUPS.reduce((sum, g) => sum + g.judgeCount, 0);
  const totalCategories = CATEGORY_GROUPS.reduce((sum, g) => sum + g.categories.length, 0);

  console.log(`\n${"=".repeat(55)}`);
  console.log(`  Seed complete`);
  console.log(`  ${totalCategories} categories across ${CATEGORY_GROUPS.length} groups`);
  console.log(`  ${totalProjects} projects across ${ROOMS.length} rooms`);
  console.log(`  ${totalJudges} judges:`);
  for (const g of CATEGORY_GROUPS) {
    console.log(`    ${g.sponsor.padEnd(12)} ${g.judgeCount}`);
  }
  console.log(`  Judging is OFF — distribute judges then enable`);
  console.log(`${"=".repeat(55)}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async err => { console.error(err); await prisma.$disconnect(); process.exit(1); });
