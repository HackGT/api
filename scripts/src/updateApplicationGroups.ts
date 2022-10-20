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
      applicationBranch: new ObjectId("62e1d823a74cdec5d68e47c2"),
      status: "APPLIED",
    },
    {
      $set: {
        confirmationBranch: new ObjectId("6347a4bc9302d0a8c4d0c0b6"),
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
