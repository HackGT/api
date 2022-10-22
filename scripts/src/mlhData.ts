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
          new ObjectId("630a87ad4350de7de590ebd8"),
          new ObjectId("630540a63d16456628e36b8a"),
          new ObjectId("630540c23d16456628e36b8b"),
        ],
      },
    })
    .toArray();

  const data = res.map(doc => ({
    "name": doc.name,
    "email": doc.email,
    "dateOfBirth": doc.applicationData.dateOfBirth,
    "school": doc.applicationData.school,
    "phoneNumber": doc.applicationData.phoneNumber,
    "country": doc.applicationData.countryOfResidence || "United States of America",
    "levelOfStudy": doc.applicationData.levelOfStudy || "Undergraduate University (3+ year)",
    "MLH-Code-Of-Conduct": doc.applicationData.confirmChecks["MLH-Code-Of-Conduct"] || false,
    "MLH-Terms-and-Conditions":
      doc.applicationData.confirmChecks["MLH-Terms-and-Conditions"] || false,
    "MLH-Information-Emails": doc.applicationData.confirmChecks["MLH-Information-Emails"] || false,
  }));

  let output =
    "Name,Email,Date of Birth,School,Phone Number,Country,Level of Study,MLH Code of Conduct,MLH Terms and Conditions,MLH Information Emails\n";
  for (const doc of data) {
    output += `${doc.name},${doc.email},${doc.dateOfBirth},${doc.school},${doc.phoneNumber},${doc.country},${doc.levelOfStudy},${doc["MLH-Code-Of-Conduct"]},${doc["MLH-Terms-and-Conditions"]},${doc["MLH-Information-Emails"]}\n`;
  }

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(path.resolve(__dirname, "../output/MLH Data.csv"), output);
  });

  console.log(`Exported ${data.length} users data`);
  console.info("\nDone.");
})();
