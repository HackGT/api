/* eslint-disable no-await-in-loop */
import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://localhost:7777";
const HACKGT13_TEST_ID = "6a8b6d7b81b659b71f58be7a";

async function updateConfigs() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    // Update expo config
    const expoDb = client.db("expo");
    const expoResult = await expoDb.collection("configs").updateOne(
      { id: 1 },
      { $set: { currentHexathon: HACKGT13_TEST_ID } },
      { upsert: true }
    );
    console.log(`Expo config updated: ${expoResult.modifiedCount || expoResult.upsertedCount} record(s)`);

    // Update registration config (if it exists)
    const registrationDb = client.db("registration");
    const regResult = await registrationDb.collection("configs").updateOne(
      { id: 1 },
      { $set: { currentHexathon: HACKGT13_TEST_ID } },
      { upsert: true }
    );
    console.log(`Registration config updated: ${regResult.modifiedCount || regResult.upsertedCount} record(s)`);

    console.log("\n✓ Both expo and registration are now set to HackGT 13 TEST");
  } finally {
    await client.close();
  }
}

(async () => {
  try {
    await updateConfigs();
  } catch (error) {
    console.error("Failed:", error);
    process.exitCode = 1;
  }
})();
