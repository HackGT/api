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
  const applicationsCollection = client.db("registration").collection<any>("applications");

  const interaction = await interactionsCollection.findOne({
    hexathon: new ObjectId("647fee51768e521dc8ef88e0"),
    type: "check-in",
  });

  console.log(interaction);
};

(async () => {
  await findHexathonUsers();

  console.info("\nDone.");
})();
