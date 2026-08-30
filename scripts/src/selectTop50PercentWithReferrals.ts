import { MongoClient, ObjectId } from "mongodb";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_PORT = 7777;
const MONGO_URI = `mongodb://127.0.0.1:${LOCAL_PORT}`;
const CONNECT_TIMEOUT_MS = 10_000;
const OUTPUT_FILE = "hackgt13_top50_candidates.json";
const OUTPUT_DIR = "output";

// Configuration for HackGT 13
const BRANCH_ID = "6a5e65c0225b2798e02ef060"; // early reimbursement
const HEXATHON_ID = "6a35c6f74d072a2177de9d2e"; // HackGT 13
const TARGET_CONFIRMATION_BRANCH_ID = "6a8e630570e73013f82814ba"; // accepted without travel
const EXCLUSION_CONFIRMATION_BRANCH_ID = "6a8f43b5731b1742868abed0"; // travel reimbursement general

const EXEC_REFER_BONUS = 100;
const MEMBER_REFER_BONUS = 2;

const EXEC_EMAILS = new Set([
  "jasmine.yuen@hexlabs.org",
  "amisha.sao@hexlabs.org",
  "mitesh.shah@hexlabs.org",
  "aiden.dowling@hexlabs.org",
  "gautam.krishnan@hexlabs.org",
]);

// Set to false for dry-run, true for real database updates
const IS_REAL_RUN = false;

interface ApplicationScore {
  _id: string;
  email: string;
  name: string;
  finalScore: number;
  confirmationBranch?: string;
  totalScore: number;
  referralBonus: number;
}

interface OutputData {
  isRealRun: boolean;
  isDryRun: boolean;
  timestamp: string;
  totalApplications: number;
  top50PercentCount: number;
  alreadyInTravelReimbursement: number;
  eligibleCount: number;
  selectedApplicationIds: string[];
  detailedScores: Array<{
    email: string;
    name: string;
    totalScore: number;
    referralBonus: number;
    finalScore: number;
    alreadyInTravelReimbursement: boolean;
  }>;
}

async function run() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB.");

    const applicationsConn = client.db("registration").collection("applications");
    const referralsConn = client.db("registration").collection("referrals");

    console.log(`\n🔎 Fetching referrals with status 'SUBMITTED'...`);
    const referrals = await referralsConn
      .find(
        {
          hexathon: new ObjectId(HEXATHON_ID),
          status: "SUBMITTED",
        },
        { projection: { referrerEmail: 1, "referralData.email": 1 } }
      )
      .toArray();

    console.log(`Found ${referrals.length} referral(s).`);

    console.log(`\n🔎 Fetching applications with status 'APPLIED' in target branch...`);
    const apps = await applicationsConn
      .find(
        {
          hexathon: new ObjectId(HEXATHON_ID),
          applicationBranch: new ObjectId(BRANCH_ID),
          status: "APPLIED",
        },
        {
          projection: {
            _id: 1,
            finalScore: 1,
            name: 1,
            email: 1,
            confirmationBranch: 1,
          },
        }
      )
      .toArray();

    console.log(`Found ${apps.length} application(s).`);

    // Build referral bonus map
    const referralsToScoreBonus = new Map<string, number>();
    for (const r of referrals) {
      const currBonusVal = referralsToScoreBonus.get(r.referralData.email) ?? 0;
      const newBonusVal = Math.max(
        currBonusVal,
        EXEC_EMAILS.has(r.referrerEmail) ? EXEC_REFER_BONUS : MEMBER_REFER_BONUS
      );

      if (newBonusVal > currBonusVal) {
        referralsToScoreBonus.set(r.referralData.email, newBonusVal);
      }
    }

    // Create application score objects
    const appObjs: ApplicationScore[] = apps.map((a: any) => ({
      _id: a._id.toString(),
      email: a.email,
      name: a.name,
      finalScore: a.finalScore ?? 0,
      confirmationBranch: a.confirmationBranch?.toString(),
      totalScore: (a.finalScore ?? 0) + (referralsToScoreBonus.get(a.email) ?? 0),
      referralBonus: referralsToScoreBonus.get(a.email) ?? 0,
    }));

    // Sort by total score descending
    const sortedApps = appObjs.sort((a, b) => b.totalScore - a.totalScore);

    // Identify top 50%
    const top50Percent = Math.ceil(sortedApps.length / 2);
    const topApps = sortedApps.slice(0, top50Percent);

    console.log(`\n📊 Total applications: ${sortedApps.length}`);
    console.log(`📊 Top 50% count: ${topApps.length}`);

    // Filter out those already in travel reimbursement branch
    const exclusionBranchObjId = new ObjectId(EXCLUSION_CONFIRMATION_BRANCH_ID);
    const eligible = topApps.filter(
      app => app.confirmationBranch !== exclusionBranchObjId.toString()
    );

    const alreadyInTravelReimburse = topApps.length - eligible.length;
    console.log(`⏭️  Excluded (already in travel reimbursement): ${alreadyInTravelReimburse}`);
    console.log(`✅ Eligible for new branch: ${eligible.length}`);

    // Prepare output
    const outputData: OutputData = {
      isRealRun: IS_REAL_RUN,
      isDryRun: !IS_REAL_RUN,
      timestamp: new Date().toISOString(),
      totalApplications: sortedApps.length,
      top50PercentCount: topApps.length,
      alreadyInTravelReimbursement: alreadyInTravelReimburse,
      eligibleCount: eligible.length,
      selectedApplicationIds: eligible.map(app => app._id),
      detailedScores: eligible.map(app => ({
        email: app.email,
        name: app.name,
        totalScore: app.totalScore,
        referralBonus: app.referralBonus,
        finalScore: app.finalScore,
        alreadyInTravelReimbursement: false,
      })),
    };

    // Write output file
    await mkdir(path.resolve(__dirname, `../${OUTPUT_DIR}`), { recursive: true });
    const outputPath = path.resolve(__dirname, `../${OUTPUT_DIR}/${OUTPUT_FILE}`);
    await writeFile(outputPath, JSON.stringify(outputData, null, 2), "utf8");

    console.log(`\n✅ Output written to: ${outputPath}`);
    console.log(`\n📋 Summary:`);
    console.log(`  Total applications in branch: ${outputData.totalApplications}`);
    console.log(`  Top 50% count: ${outputData.top50PercentCount}`);
    console.log(`  Already in travel reimbursement: ${outputData.alreadyInTravelReimbursement}`);
    console.log(`  ✅ Ready to move to target branch: ${outputData.eligibleCount}`);

    if (!IS_REAL_RUN) {
      console.log(`\n⚠️  DRY RUN: No database changes were made.`);
      console.log(`\n📝 Next steps:`);
      console.log(`  1. Review the output file: ${outputPath}`);
      console.log(`  2. Run decideApplications.ts with the APPLICATION_IDS from selectedApplicationIds`);
      console.log(`  3. Set CONFIRMATION_BRANCH_ID to: ${TARGET_CONFIRMATION_BRANCH_ID}`);
    }
  } finally {
    await client.close();
    console.log("\n🔒 Connection to MongoDB closed.");
  }
}

(async () => {
  try {
    await run();
    console.info("\nDone.");
  } catch (error) {
    console.error("Failed:", error);
    process.exitCode = 1;
  }
})();
