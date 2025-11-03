/* eslint-disable no-await-in-loop */
import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const findHexathonUsers = async () => {
  await client.connect();
  const interactionsCollection = client.db("hexathons").collection<any>("interactions");

  const cursor = interactionsCollection.find({
    hexathon: new ObjectId("683f9a9ab75ad31cd0f2ec67"),
    event: new ObjectId("68c5e46313e394ebeb110b41"),
    type: "event",
  });
  const interactions = await cursor.toArray();

  console.log(`Found ${interactions.length} event interactions total`);
};

(async () => {
  await findHexathonUsers();

  console.info("\nDone.");
})();
