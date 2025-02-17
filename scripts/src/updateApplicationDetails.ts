import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const updateApplicationDetails = async () => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  // Update accepted general applications
  const updatedApplications = await collection.updateMany(
    {
      applicationBranch: new ObjectId("678bdc6831e8165eb0c2686c"), // HackGTeeny Early Bird ID
      status: "DRAFT",
    },
    {
      $set: {
        applicationBranch: new ObjectId("67ae6fdc78c635f458d504a3"), // HackGTeeny Regular ID
      },
    }
  );
  console.log(`${updatedApplications.modifiedCount} application(s) updated`);
};

(async () => {
  await updateApplicationDetails();

  console.info("\nDone.");
})();
