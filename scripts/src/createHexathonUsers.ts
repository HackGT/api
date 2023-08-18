/* eslint-disable no-await-in-loop */
import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const createHexathonUsers = async () => {
  await client.connect();
  const applicationsCollection = client.db("registration").collection<any>("applications");
  const hexathonUsersCollection = client.db("hexathons").collection<any>("hexathonusers");
  const appliedApplications = await applicationsCollection.find({
    hexathon: new ObjectId("647fee51768e521dc8ef88e0"),
    status: "APPLIED",
  });
  let hexathonUsers = 0;

  for await (const application of appliedApplications) {
    try {
      // first check if user already exists
      const existingHexathonUser = await hexathonUsersCollection.findOne({
        userId: application.userId,
        hexathon: new ObjectId("647fee51768e521dc8ef88e0"),
      });

      if (existingHexathonUser) {
        continue;
      }

      await hexathonUsersCollection.insertOne({
        userId: application.userId,
        email: application.email,
        name: application.name,
        hexathon: application.hexathon,
        profile: {
          school: application.applicationData.school,
          year: application.applicationData.schoolYear,
          major: application.applicationData.major,
          matched: application.applicationData.matched,
        },
      });
      hexathonUsers += 1;
    } catch (err: any) {
      console.log(err.message);
    }
  }

  console.log(`Created ${hexathonUsers} hexathon users.`);
};

(async () => {
  await createHexathonUsers();

  console.info("\nDone.");
})();
