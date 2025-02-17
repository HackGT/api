import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  console.error("Unhandled promise rejection:", err);
  process.exit(1);
});

const client = new MongoClient("mongodb://localhost:7777");

const deleteApplication = async (applicationId: string) => {
  try {
    if (!ObjectId.isValid(applicationId)) {
      throw new Error("Invalid application ID format.");
    }

    await client.connect();
    const db = client.db("registration");
    const collection = db.collection("applications");

    const result = await collection.deleteOne({ _id: new ObjectId(applicationId) });

    if (result.deletedCount > 0) {
      console.log(`✅ Application ${applicationId} deleted successfully.`);
    } else {
      console.warn(`⚠️ No application found with ID: ${applicationId}`);
    }
  } catch (error) {
    console.error("❌ Error deleting application:", error);
  } finally {
    await client.close();
    console.info("\nConnection closed. Done.");
  }
};

// Example usage
(async () => {
  const applicationId = "67b286c0246f68f77f429919"; // Replace with actual application ID
  await deleteApplication(applicationId);
})();
