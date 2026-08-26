import { MongoClient, ObjectId } from "mongodb";

const LOCAL_PORT = 7777;
const MONGO_URI = `mongodb://127.0.0.1:${LOCAL_PORT}`;
const CONNECT_TIMEOUT_MS = 10_000;

async function run() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });

  const NEW_ROLES = { member: 1, exec: 0, admin: 0 };

  try {
    await client.connect();
    const permissionsConn = client.db("auth").collection("permissions");
    const profilesConn = client.db("users").collection("profiles");

    const profiles = await profilesConn
      .find(
        { email: { $regex: "[\\w\\.]*@hexlabs\\.org$" } },
        { projection: { userId: 1, email: 1 } }
      )
      .toArray();

    for (const p of profiles) {
      console.log(`${p.email} | ${p.userId}`);
    }
    console.log(profiles.length);

    const userIds = profiles.map(p => p.userId).filter(Boolean);

    const existingPermissions = await permissionsConn
      .find({ userId: { $in: userIds } }, { projection: { userId: 1 } })
      .toArray();
    const existingUserIds = new Set(
      existingPermissions.map(permission => String(permission.userId))
    );
    const newUserIds = userIds.filter(userId => !existingUserIds.has(String(userId)));

    if (newUserIds.length === 0) {
      console.log("no users without perms, stopping");
    }

    const result = await permissionsConn.insertMany(
      newUserIds.map(userId => ({ userId, roles: NEW_ROLES }))
    );

    console.log(result);
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
