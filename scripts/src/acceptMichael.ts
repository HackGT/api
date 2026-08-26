import { MongoClient, ObjectId } from "mongodb";
import readline from "readline/promises";

const LOCAL_PORT = 7777;
const MONGO_URI = `mongodb://127.0.0.1:${LOCAL_PORT}`;
const CONNECT_TIMEOUT_MS = 10_000;

const TESTACC_USER_ID = "87o0vujtaLh0zzKKULGNFT3RUEN2";

/*
hackgt13:
  hexathon  | 6a35c6f74d072a2177de9d2e
  early no reimburse | 6a5e6039411b11d8f9ff7cbd
  early reimburse | 6a5e65c0225b2798e02ef060
*/

function makeTestApp(hexathonId: string, branchId: string, confirmationBranchId?: string) {
  return {
    name: `Michael (testacc)`,
    email: "msheng98074@outlook.com",
    userId: TESTACC_USER_ID,
    hexathon: new ObjectId(hexathonId),
    confirmationBranch: confirmationBranchId ? new ObjectId(confirmationBranchId) : undefined,
    applicationBranch: new ObjectId(branchId),
    applicationData: {
      firstName: "Michael (testacc)",
      lastName: "Sheng",
      adult: true,
      dateOfBirth: "2005-01-01",
      school: "gt or smth",
      schoolEmail: "msheng98074@outlook.com",
      schoolYear: "1st Year",
      levelOfStudy: "Undergraduate University (3+ year)",
      countryOfResidence: "United States of America",
      major: "Computer Science",
      shirtSize: "L",
      dietaryRestrictions: [],
      phoneNumber: "5557775555",
      gender: "Male",
      ethnicity: "",
      address: {},
      marketing: "Google",
      website: "",
      linkedin: "",
      skills: [],
      extraInfo: "yo",
      confirmChecks: {
        "Hexlabs-Photo-Release-Waiver": true,
        "HexLabs-Privacy-Policy": true,
      },
      mlhConfirmations: {
        "MLH-Code-of-Conduct": true,
        "MLH-Privacy-and-Terms": true,
        "MLH-Email-Communication": true,
      },
      tessays: [
        {
          criteria: "Aspiration",
          answer: "<TEST ONLY. ACCEPTED THRU SCRIPT. Please score 1 and disregard.>",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d28"),
        },
        {
          criteria: "Creativity",
          answer: "<TEST ONLY. ACCEPTED THRU SCRIPT. Please score 1 and disregard.>",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d29"),
        },
        {
          criteria: "Learning",
          answer: "<TEST ONLY. ACCEPTED THRU SCRIPT. Please score 1 and disregard.>",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d2a"),
        },
        {
          criteria: "Experience",
          answer: "<TEST ONLY. ACCEPTED THRU SCRIPT. Please score 1 and disregard.>",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d2b"),
        },
      ],
      matched: true,
    },
    applicationStartTime: new Date("2000-07-22T22:01:15.337Z"),
    status: "ACCEPTED",
    finalScore: 999999,
    gradingComplete: true,
    createdAt: new Date("2000-07-20T22:01:15.339Z"),
    updatedAt: new Date("2000-08-13T03:14:41.558Z"),
    applicationSubmitTime: new Date("2001-08-13T03:14:41.558Z"),
  };
}

async function run() {
  const [, , hexathonId, branchId, confirmationBranchId] = process.argv;
  if (!hexathonId || !branchId) {
    throw new Error("positional args: <hexathon id> <branch id> [confirmation branch id]");
  }

  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });

  try {
    await client.connect();

    const applicationsConn = client.db("registration").collection("applications");

    const testApp = makeTestApp(hexathonId, branchId, confirmationBranchId);

    // check if user already has an application for this hexathon
    const existingApp = await applicationsConn.findOne({
      userId: TESTACC_USER_ID,
      hexathon: new ObjectId(hexathonId),
    });
    if (existingApp) {
      console.info(existingApp);
      console.info(`^^ Test application already exists on this hexathon ^^`);

      const prompt = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      try {
        const confirmation = await prompt.question(`overwrite? (y/n): `);
        if (confirmation.trim().toLowerCase() !== "y") {
          throw new Error("cancelled: stopping without updates.");
        } else {
          // delete existing app
          await applicationsConn.deleteOne({ _id: existingApp._id });
          console.info(
            `Deleted existing test application for ${TESTACC_USER_ID} on hexathon ${hexathonId}.`
          );
        }
      } finally {
        prompt.close();
      }
    }

    await applicationsConn.insertOne(testApp);
    console.log(`Inserted test application for ${TESTACC_USER_ID} on hexathon ${hexathonId}.`);
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
