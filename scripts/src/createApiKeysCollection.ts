import { MongoClient } from "mongodb";
import config from "@api/config";

process.on("unhandledRejection", err => {
  throw err;
});

const COLLECTION = "apikeys";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["hexathon", "provider", "key"],
    properties: {
      hexathon: { bsonType: "objectId" },
      provider: { bsonType: "string" },
      key: { bsonType: "string" },
      hexathonUser: { bsonType: "objectId" },
      claimedAt: { bsonType: "date" },
    },
  },
};

const createApiKeysCollection = async () => {
  const client = new MongoClient(config.database.mongo.uri);
  await client.connect();
  const db = client.db(config.services.HEXATHONS.database.name);

  const existing = await db.listCollections({ name: COLLECTION }).toArray();
  if (existing.length === 0) {
    await db.createCollection(COLLECTION, { validator });
    console.log(`Created collection ${COLLECTION}`);
  } else {
    await db.command({ collMod: COLLECTION, validator });
    console.log(`Updated validator on existing collection ${COLLECTION}`);
  }

  await db.collection(COLLECTION).createIndexes([
    { key: { key: 1 }, unique: true, name: "key_1" },
    { key: { hexathon: 1, provider: 1 }, name: "hexathon_1_provider_1" },
    {
      key: { hexathon: 1, provider: 1, hexathonUser: 1 },
      unique: true,
      partialFilterExpression: { hexathonUser: { $type: "objectId" } },
      name: "hexathon_1_provider_1_hexathonUser_1",
    },
  ]);
  console.log("Created indexes");

  await client.close();
};

createApiKeysCollection();
