import { MongoClient } from "mongodb";
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

  const res = await collection
    .find({
      status: "CONFIRMED",
    })
    .toArray();

  const resumeFileIds: any[] = [];
  for (const doc of res) {
    if (doc.applicationData?.resume) {
      resumeFileIds.push(doc.applicationData.resume);
    }
  }

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(
      path.resolve(__dirname, "../output/resume_file_ids.txt"),
      JSON.stringify(resumeFileIds)
    );
  });

  console.log(`${resumeFileIds.length} resumes found`);

  console.info("\nDone.");
})();
