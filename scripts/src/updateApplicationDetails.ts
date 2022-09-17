import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const updateApplicationDetails = async (applicationIds: string[]) => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  // Update accepted general applications
  const updatedApplications = await collection.updateMany(
    {
      _id: { $in: applicationIds.map(applicationId => new ObjectId(applicationId)) },
      applicationBranch: new ObjectId("62d9f03418d8d494b683c316"),
      status: "DRAFT",
    },
    {
      $set: {
        "applicationBranch": new ObjectId("630540a63d16456628e36b8a"),
        "applicationData.travelReimbursement": null,
      },
    }
  );
  console.log(`${updatedApplications.modifiedCount} application(s) updated`);
};

const APPLICATION_IDS: string[] = [];

(async () => {
  await updateApplicationDetails(APPLICATION_IDS);

  console.info("\nDone.");
})();
