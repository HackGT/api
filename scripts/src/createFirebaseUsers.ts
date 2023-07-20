/* eslint-disable no-await-in-loop */
import "@api/config";
import admin from "firebase-admin";
import { MongoClient } from "mongodb";
import postgres from "postgres";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

// admin.initializeApp();

const sql = postgres("postgres://postgres@localhost:5433/finance-default");
const mongoClient = new MongoClient("mongodb://localhost:7777");

const createFirebaseUsers = async () => {
  await mongoClient.connect();
  const profilesCollection = mongoClient.db("users").collection<any>("profiles");
  const users = await sql`SELECT * FROM "User"`;

  for (const user of users) {
    try {
      const newFirebaseUser = await admin.auth().createUser({
        email: user.email,
        emailVerified: true,
        displayName: `${user.name}`,
      });

      // Split name only by first space
      const [firstName, lastName] = user.name.split(/ (.*)/);

      await profilesCollection.insertOne({
        userId: newFirebaseUser.uid,
        email: user.email,
        name: {
          first: firstName,
          last: lastName,
        },
      });

      console.log(`Created user ${user.name} [${user.email}]`);
    } catch (err: any) {
      console.log(err.message);
    }
  }
};

(async () => {
  await createFirebaseUsers();

  console.info("\nDone.");
})();
