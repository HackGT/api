import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const updateApplicationGroups = async () => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  const updatedApplications = await collection.updateMany(
    {
      applicationBranch: new ObjectId("62d9f1ae18d8d494b683c360"),
      status: "APPLIED",
    },
    {
      $set: {
        confirmationBranch: new ObjectId("6347a7bb9302d0a8c4d0c18f"),
        status: "ACCEPTED",
      },
    }
  );

  console.log(`${updatedApplications.modifiedCount} application(s) updated`);
};

(async () => {
  await updateApplicationGroups();

  console.info("\nDone.");
})();
