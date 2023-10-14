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
      confirmationBranch: {
        $in: [
          new ObjectId("64a35c5659be5f3bc28557e8"), // Participant Confirmation
          new ObjectId("6529a20c0b9949f09de6e940"), // Participant Confirmation [Walk Up]
          new ObjectId("64f370c0dc5faf15feec8ed5"), // Accepted - Participant [Flight/Gas]
          new ObjectId("64f370ecdc5faf15feec8ef9"), // Accepted - Participant [Gas]
          new ObjectId("64f37153dc5faf15feec8f48"), // Accepted - Participant [Flight I]
          new ObjectId("64f3717cdc5faf15feec8f8b"), // Accepted - Participant [Flight II]
          new ObjectId("64f37199dc5faf15feec8f9d"), // Accepted - Participant [Flight III]
        ],
      },
    })
    .toArray();

  console.log(`Found ${res.length} users.`);

  const data = res.map(doc => ({
    name: doc.name,
    email: doc.email,
    dateOfBirth: doc.applicationData.dateOfBirth,
    school: doc.applicationData.school,
    phoneNumber: doc.applicationData.phoneNumber,
    country: doc.applicationData.countryOfResidence || "United States of America",
    levelOfStudy: doc.applicationData.levelOfStudy || "Undergraduate University (3+ year)",
    // "MLH-Code-Of-Conduct": doc.applicationData.confirmChecks["MLH-Code-Of-Conduct"] || false,
    // "MLH-Terms-and-Conditions":
    //   doc.applicationData.confirmChecks["MLH-Terms-and-Conditions"] || false,
    // "MLH-Information-Emails": doc.applicationData.confirmChecks["MLH-Information-Emails"] || false,
  }));

  let output = "Name,Email,Date of Birth,School,Phone Number,Country,Level of Study\n"; // ,MLH Code of Conduct,MLH Terms and Conditions,MLH Information Emails\n
  for (const doc of data) {
    output += `${doc.name},${doc.email},${doc.dateOfBirth},${doc.school},${doc.phoneNumber},${doc.country},${doc.levelOfStudy}\n`; // ,${doc["MLH-Code-Of-Conduct"]},${doc["MLH-Terms-and-Conditions"]},${doc["MLH-Information-Emails"]}\n
  }

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(path.resolve(__dirname, "../output/MLH Data.csv"), output);
  });

  console.log(`Exported ${data.length} users data`);
  console.info("\nDone.");
})();
