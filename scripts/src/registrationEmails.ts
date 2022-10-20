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

  const res = await collection
    .find({
      status: "CONFIRMED",
      applicationBranch: {
        $in: [
          new ObjectId("62d9f03418d8d494b683c316"),
          new ObjectId("630540a63d16456628e36b8a"),
          new ObjectId("630540c23d16456628e36b8b"),
          new ObjectId("630a87ad4350de7de590ebd8"),
        ],
      },
    })
    .toArray();

  const emails: any[] = [];
  for (const doc of res) {
    if (doc.email) {
      emails.push(doc.email);
    }
  }

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(path.resolve(__dirname, "../output/emails.csv"), emails.join("\n"));
  });

  console.log(`${emails.length} matching applications found`);

  console.info("\nDone.");
})();
