import config from "@api/config";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient(config.database.mongo.uri);

(async () => {
  await client.connect();

  const db = client.db("registration");
  const collection = db.collection("applications");

  const res = await collection.find({ status: "DRAFT" }).toArray();

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
