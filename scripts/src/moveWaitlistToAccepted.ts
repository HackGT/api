import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection
process.on("unhandledRejection", err => {
  throw err;
});

const IS_REAL_RUN = true;
const MONGO_URI = "mongodb://localhost:7777";

const applicationBranchIds = [
  new ObjectId("683f9bb6d58f3f52fa01c515"), // Participant (Early Bird, No Reimbursement)
  new ObjectId("683f9c55d58f3f52fa01c51a"), // Participant (Travel Reimbursement)
  new ObjectId("683fcf83d58f3f52fa01c541"), // Participant (Regular, No Reimbursement)
  new ObjectId("6864951aa334a6b56af14000"), // Priority Application
];

const moveWaitlistedToAccepted = async () => {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB.");

    const db = client.db("registration"); // Use your database name
    const collection = db.collection<any>("applications"); // Use your collection name

    const findCriteria = {
      applicationBranch: { $in: applicationBranchIds },
      status: "WAITLISTED",
    };

    const limit = 250;

    console.log(`\n🔎 Finding up to ${limit} applications with status "WAITLISTED"...`);

    // Step 1: Find the specific _id's of the documents to update, respecting the limit.
    // We only need the _id, so we use .project({ _id: 1 }) for efficiency.
    const applicationsToMove = await collection
      .find(findCriteria)
      .limit(limit)
      .project({ _id: 1 })
      .toArray();

    const applicationIdsToMove = applicationsToMove.map(app => app._id);
    const count = applicationIdsToMove.length;

    if (count === 0) {
      console.log("👍 No applications found matching the criteria. No action taken.");
      return;
    }

    console.log(`Found ${count} application(s) to move.`);

    // Step 2: Use the array of _id's to update only those specific documents.
    const updateCriteria = {
      _id: { $in: applicationIdsToMove },
    };

    if (IS_REAL_RUN) {
      console.log("\n⚡ Performing REAL RUN: Updating statuses to 'ACCEPTED'...");

      const updateResult = await collection.updateMany(updateCriteria, {
        $set: {
          status: "ACCEPTED",
          confirmationBranchId: new ObjectId("68d1d446a9fc3f1c0e14b4af"),
        },
      });

      console.log(
        `\n✅ Success! ${updateResult.modifiedCount} application(s) moved from WAITLISTED to ACCEPTED.`
      );
    } else {
      console.log("\nDRY RUN: No changes were made to the database.");
      console.log(`Would have moved ${count} application(s) from WAITLISTED to ACCEPTED.`);
    }
  } finally {
    await client.close();
    console.log("\n🔒 Connection to MongoDB closed.");
  }
};

(async () => {
  await moveWaitlistedToAccepted();
  console.info("\nDone.");
})().catch(err => {
  console.error("An error occurred during the script execution:", err);
  process.exit(1);
});
