/* eslint-disable no-await-in-loop */
import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const findHexathonUsers = async () => {
  await client.connect();
  const applicationsCollection = client.db("registration").collection<any>("applications");
  const hexathonUsersCollection = client.db("hexathons").collection<any>("hexathonusers");

  const user = await hexathonUsersCollection.findOne({
    hexathon: new ObjectId("683f9a9ab75ad31cd0f2ec67"),
  });

  // print the user
  console.log(user);
};

(async () => {
  await findHexathonUsers();

  console.info("\nDone.");
})();
