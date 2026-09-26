/**
 * Load test seed script — run with:
 *   cd services/expo
 *   POSTGRES_URI="postgres://postgres@localhost" POSTGRES_URI_EXPO_SERVICE="postgres://postgres@localhost/expo" \
 *   ../../node_modules/.bin/ts-node prisma/seed-load-test.ts
 *
 * Creates:
 *   - 300 projects (150 per expo, tables 1–150)
 *   - 50 judges with a shared category group
 *   - Wipes existing projects, assignments, ballots, users, category groups first
 */

import { PrismaClient } from "./generated";
import { MongoClient } from "mongodb";
import { writeFileSync } from "fs";
import { resolve } from "path";

const CONFIG_OUT = resolve(__dirname, "../../../../timber/load-test-config.json");

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const HEXATHON_SHORT_CODE = process.env.HEXATHON_SHORT_CODE ?? "test";

const prisma = new PrismaClient();

const NUM_PROJECTS_PER_EXPO = 150;
const NUM_EXPOS = 2;
const NUM_JUDGES = 50;

const PROJECT_NAMES = [
  "AI", "Eco", "Medi", "Safe", "Food", "Smart", "Green", "Open", "Fast", "Data",
  "Cloud", "Edge", "Nano", "Bio", "Geo", "Civic", "Arc", "Flow", "Lens", "Link",
  "Mesh", "Net", "Node", "Orbit", "Pulse", "Route", "Scale", "Stack", "Track", "Wave",
];
const PROJECT_SUFFIXES = [
  "Bridge", "Buddy", "Connect", "Core", "Drive", "Finder", "Guard", "Hub", "Lab",
  "Map", "Match", "Mind", "Net", "Path", "Ping", "Scan", "Scout", "Sense", "Share",
  "Shield", "Sight", "Spark", "Sync", "Trace", "Trail", "Tree", "Vault", "Watch", "Wire",
];

function randomProjectName(index: number): string {
  const name = PROJECT_NAMES[index % PROJECT_NAMES.length];
  const suffix = PROJECT_SUFFIXES[Math.floor(index / PROJECT_NAMES.length) % PROJECT_SUFFIXES.length];
  return `${name}${suffix} ${index + 1}`;
}

async function main() {
  // Resolve hexathon ID from MongoDB
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const hexathon = await mongo.db("hexathons").collection("hexathons").findOne({ shortCode: HEXATHON_SHORT_CODE });
  await mongo.close();

  if (!hexathon) {
    throw new Error(`No hexathon found with shortCode "${HEXATHON_SHORT_CODE}". Set HEXATHON_SHORT_CODE env var to match your hexathon.`);
  }
  const HEXATHON_ID = hexathon._id.toString();
  console.log(`Using hexathon: "${hexathon.name}" (${HEXATHON_ID})`);

  console.log("Clearing existing load test data...");

  await prisma.ballot.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.categoryGroup.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.criteria.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("Cleared.");

  // Create the default category and its criteria
  const category = await prisma.category.create({
    data: {
      name: "General",
      isDefault: true,
      description: "General judging category",
      hexathon: HEXATHON_ID,
      criterias: {
        create: [
          { name: "Innovation", description: "How innovative is the project?", minScore: 1, maxScore: 10 },
          { name: "Technical Complexity", description: "How technically complex is the project?", minScore: 1, maxScore: 10 },
          { name: "Design", description: "How well designed is the project?", minScore: 1, maxScore: 10 },
        ],
      },
    },
    include: { criterias: true },
  });
  const criteriaIds = category.criterias.map(c => c.id);
  console.log(`Created category: ${category.id} — ${category.name} with criteria IDs ${criteriaIds.join(", ")}`);

  // Create category group for judges
  const categoryGroup = await prisma.categoryGroup.create({
    data: {
      name: "General Judges",
      hexathon: HEXATHON_ID,
      categories: { connect: [{ id: category.id }] },
    },
  });
  console.log(`Created category group: ${categoryGroup.id} — ${categoryGroup.name}`);

  // Create 50 judges
  console.log(`Creating ${NUM_JUDGES} judges...`);
  const judges = await Promise.all(
    Array.from({ length: NUM_JUDGES }, (_, i) => {
      const num = String(i + 1).padStart(3, "0");
      return prisma.user.create({
        data: {
          name: `Judge ${num}`,
          email: `judge${num}@loadtest.dev`,
          userId: `load-test-judge-${num}`,
          categoryGroups: { connect: [{ id: categoryGroup.id }] },
        },
      });
    })
  );
  console.log(`Created ${judges.length} judges.`);

  // Create 300 projects across 2 expos, tables 1–150 each
  console.log(`Creating ${NUM_PROJECTS_PER_EXPO * NUM_EXPOS} projects...`);
  let projectCount = 0;
  for (let expo = 1; expo <= NUM_EXPOS; expo++) {
    for (let table = 1; table <= NUM_PROJECTS_PER_EXPO; table++) {
      const idx = (expo - 1) * NUM_PROJECTS_PER_EXPO + (table - 1);
      await prisma.project.create({
        data: {
          name: randomProjectName(idx),
          description: `Load test project at table ${table}, expo ${expo}.`,
          githubUrl: `https://github.com/loadtest/project-${idx + 1}`,
          devpostUrl: `https://devpost.com/loadtest-project-${idx + 1}`,
          hexathon: HEXATHON_ID,
          expo,
          round: 1,
          table,
          categories: { connect: [{ id: category.id }] },
        },
      });
      projectCount++;
    }
    console.log(`  Expo ${expo}: ${NUM_PROJECTS_PER_EXPO} projects created.`);
  }
  console.log(`Created ${projectCount} projects total.`);

  // Update config to expo 1
  await prisma.config.upsert({
    where: { id: 1 },
    update: {
      currentHexathon: HEXATHON_ID,
      currentExpo: 1,
      currentRound: 1,
      isJudgingOn: true,
      isProjectSubmissionOpen: false,
    },
    create: {
      currentHexathon: HEXATHON_ID,
      currentExpo: 1,
      currentRound: 1,
      isJudgingOn: true,
      isProjectSubmissionOpen: false,
    },
  });
  console.log("Config updated: expo 1, judging on.");

  // Write config for k6
  const judgeIds = judges.map(j => j.id).sort((a, b) => a - b);
  const k6Config = { judgeIds, criteriaIds };
  writeFileSync(CONFIG_OUT, JSON.stringify(k6Config, null, 2));

  console.log("\n=== Seed complete ===");
  console.log(`Judges: ${judges.length} (IDs ${judgeIds[0]}–${judgeIds[judgeIds.length - 1]})`);
  console.log(`Config written to: ${CONFIG_OUT}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async err => { console.error(err); await prisma.$disconnect(); process.exit(1); });
