import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

(async () => {
  await client.connect();

  const db = client.db("registration");
  const collection = db.collection("applications");

  // Change this depending on the hexathon you want to export resumes from
  const currentHexathon = new ObjectId("683f9a9ab75ad31cd0f2ec67");

  const projectSubmissions = await client
    .db("hexathons")
    .collection("interactions")
    .find({
      hexathon: currentHexathon,
      type: "expo-submission",
    })
    .toArray();

  console.log(`${projectSubmissions.length} project submissions found`);

  const res = await collection
    .find({
      hexathon: currentHexathon,
      status: "CHECKED_IN",
      userId: { $in: projectSubmissions.map(s => s.userId) },
    })
    .toArray();

  console.log(`${res.length} checked-in applications found with project submissions`);

  const resumeFileIds: any[] = [];
  for (const doc of res) {
    if (doc.applicationData?.resume) {
      resumeFileIds.push(doc.applicationData.resume);
    }
  }

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(
      path.resolve(__dirname, "../output/submitted_projects_resume_file_ids.txt"),
      resumeFileIds.join("\n")
    );
  });

  console.log(`${resumeFileIds.length} resumes found`);

  console.info("\nDone.");
})();
