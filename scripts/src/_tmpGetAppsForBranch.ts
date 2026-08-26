import { MongoClient, ObjectId } from "mongodb";
import { writeFile } from "node:fs/promises";

const LOCAL_PORT = 7777;
const MONGO_URI = `mongodb://127.0.0.1:${LOCAL_PORT}`;
const CONNECT_TIMEOUT_MS = 10_000;
const OUTPUT_FILE = "_tmpGetAppsForBranch2.txt";

const BRANCH_ID = "6a5e65c0225b2798e02ef060";
const HEXATHON_ID = "6a35c6f74d072a2177de9d2e";

const EXEC_REFER_BONUS = 0;
const MEMBER_REFER_BONUS = 0;

const EXEC_EMAILS = new Set([
  "jasmine.yuen@hexlabs.org",
  "amisha.sao@hexlabs.org",
  "mitesh.shah@hexlabs.org",
  "aiden.dowling@hexlabs.org",
  "gautam.krishnan@hexlabs.org",
]);

async function run() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });

  try {
    await client.connect();
    const applicationsConn = client.db("registration").collection("applications");
    const referralsConn = client.db("registration").collection("referrals");

    const referrals = await referralsConn
      .find(
        {
          "hexathon": new ObjectId(HEXATHON_ID),
          "status": "SUBMITTED",
          "referralData.referForReimbursement": true,
        },
        { projection: { "referrerEmail": 1, "referralData.email": 1 } }
      )
      .toArray();

    const apps = await applicationsConn
      .find(
        { applicationBranch: new ObjectId(BRANCH_ID), status: "APPLIED" },
        { projection: { finalScore: 1, userId: 1, name: 1, email: 1, applicationSubmitTime: 1 } }
      )
      .toArray();

    const referralsToScoreBonus = new Map<string, number>();
    for (const r of referrals) {
      const currBonusVal = referralsToScoreBonus.get(r.referralData.email) ?? 0;
      const newBonusVal = Math.max(
        currBonusVal,
        EXEC_EMAILS.has(r.referrerEmail) ? EXEC_REFER_BONUS : MEMBER_REFER_BONUS
      );

      console.log(
        `referral for ${r.referralData.email} by ${r.referrerEmail} gives bonus ${newBonusVal}`
      );
      referralsToScoreBonus.set(r.referralData.email, newBonusVal);
    }

    const appObjs = apps.map(a => ({
      email: a.email,
      totalScore: a.finalScore + (referralsToScoreBonus.get(a.email) ?? 0),
      referralBonus: referralsToScoreBonus.get(a.email) ?? 0,
    }));

    const sortedApps = appObjs.sort((a, b) => b.totalScore - a.totalScore);

    const output: string[] = [String(apps.length)];
    for (const app of sortedApps) {
      output.push(
        `${app.email.padEnd(35, " ")} | ${String(app.totalScore).padStart(6, " ")} | referral bonus: ${app.referralBonus}`
      );
    }

    await writeFile(OUTPUT_FILE, `${output.join("\n")}\n`, "utf8");
  } finally {
    await client.close();
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
