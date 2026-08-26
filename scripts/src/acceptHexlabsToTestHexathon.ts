import { MongoClient, ObjectId } from "mongodb";

const LOCAL_PORT = 7777;
const MONGO_URI = `mongodb://127.0.0.1:${LOCAL_PORT}`;
const CONNECT_TIMEOUT_MS = 10_000;

function makeTestApp(email: string, userId: string) {
  return {
    name: `tester ${userId}`,
    email,
    userId,
    hexathon: new ObjectId("6a8b6d7b81b659b71f58be7a"),
    applicationBranch: new ObjectId("6a8b779e33c764f01f2e0a4f"),
    applicationData: {
      firstName: "tester",
      lastName: userId,
      adult: true,
      dateOfBirth: "2005-01-01",
      school: "gt or smth",
      schoolEmail: email,
      schoolYear: "1st Year",
      levelOfStudy: "Undergraduate University (3+ year)",
      countryOfResidence: "United States of America",
      major: "Computer Science",
      shirtSize: "L",
      dietaryRestrictions: [],
      phoneNumber: "5555555555",
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
          answer: "test",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d28"),
        },
        {
          criteria: "Creativity",
          answer: "test2",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d29"),
        },
        {
          criteria: "Learning",
          answer: "test3",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d2a"),
        },
        {
          criteria: "Experience",
          answer: "test4",
          _id: new ObjectId("6a7d369dae6c3bda8cbb4d2b"),
        },
      ],
      matched: true,
    },
    applicationStartTime: new Date("2026-07-22T22:01:15.337Z"),
    status: "CHECKED_IN",
    gradingComplete: true,
    createdAt: new Date("2026-07-20T22:01:15.339Z"),
    updatedAt: new Date("2026-08-13T03:14:41.558Z"),
    applicationSubmitTime: new Date("2026-08-13T03:14:41.558Z"),
  };
}

async function run() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });

  try {
    await client.connect();

    const applicationsConn = client.db("registration").collection("applications");
    const permissionsConn = client.db("auth").collection("permissions");
    const profilesConn = client.db("users").collection("profiles");

    // for every doc in the auth.permissions coll:
    // if the roles.member === true,
    const members = await permissionsConn.find({ "roles.member": true }).toArray();

    console.info(`Found ${members.length} hexlabs members.`);

    const profiles = await profilesConn
      .find(
        { userId: { $in: members.map(member => member.userId) } },
        { projection: { userId: 1, email: 1 } }
      )
      .toArray();

    const emailByUserId = new Map(
      profiles.map(profile => {
        console.log(`${profile.userId} -> ${profile.email}`);
        return [profile.userId, profile.email];
      })
    );

    const testApps = members.map(member =>
      makeTestApp(emailByUserId.get(member.userId), member.userId)
    );

    console.log(`there are ${testApps.length} apps to make`);

    // insert all the apps
    await applicationsConn.insertMany(testApps);
    console.info(`Inserted ${testApps.length} test applications.`);
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
