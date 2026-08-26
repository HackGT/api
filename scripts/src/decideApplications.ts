import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = "mongodb://localhost:7777";

// Replace these values before running the script.
const APPLICATION_IDS: string[] = [
  "6a5e8ce086862c9c2006acb1",
  "6a6e6b91235b2321024e3cb2",
  "6a716ab1a4cfe631cfefcdd4",
  "6a5ed8473bc77ffadd5cfa4a",
  "6a5fd495bf1b56691da85cb0",
  "6a601f4484dad1ce3141a6f0",
  "6a67996cf2c53f6d3094aea1",
  "6a70eb6ea9ed47ff0940b11b",
  "6a71ff198427407ba8602cb1",
  "6a7654d05656004d66a68512",
  "6a78c1aec93a435ced3e39d4",
  "6a7b3528b16f8311798915a0",
  "6a7be4e5d78d3180bf19d370",
  "6a7bfd44d78d3180bf19f452",
  "6a5ee4673bc77ffadd5d052c",
  "6a5e8e6886862c9c2006adf6",
  "6a7e6c3816b74edf5f263927",
  "6a6fa92c8ca8bf01a3ab94db",
];
const NEW_STATUS = "ACCEPTED";
const CONFIRMATION_BRANCH_ID = "6a8f43b5731b1742868abed0";

async function run() {
  if (APPLICATION_IDS.length === 0) {
    throw new Error("APPLICATION_IDS must contain at least one application ID.");
  }
  if (APPLICATION_IDS.some(id => !ObjectId.isValid(id))) {
    throw new Error("APPLICATION_IDS must contain only valid application IDs.");
  }
  if (CONFIRMATION_BRANCH_ID !== undefined && !ObjectId.isValid(CONFIRMATION_BRANCH_ID)) {
    throw new Error("CONFIRMATION_BRANCH_ID must be a valid branch ID.");
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const applications = client.db("registration").collection("applications");
    const update: any = {
      $set: {
        status: NEW_STATUS,
      },
    };

    if (CONFIRMATION_BRANCH_ID !== undefined) {
      update.$set.confirmationBranch = new ObjectId(CONFIRMATION_BRANCH_ID);
    }

    const result = await applications.updateMany(
      { _id: { $in: APPLICATION_IDS.map(id => new ObjectId(id)) } },
      update
    );

    console.log(`Modified ${result.modifiedCount} application(s).`);
  } finally {
    await client.close();
  }
}

(async () => {
  try {
    await run();
    console.info("\nDone.");
  } catch (error) {
    console.error("Failed:", error);
    process.exitCode = 1;
  }
})();
