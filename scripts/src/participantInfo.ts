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
          new ObjectId("64f370c0dc5faf15feec8ed5"), // Accepted - Participant [Flight/Gas]
          new ObjectId("64f370ecdc5faf15feec8ef9"), // Accepted - Participant [Gas]
          new ObjectId("64f37153dc5faf15feec8f48"), // Accepted - Participant [Flight I]
          new ObjectId("64f3717cdc5faf15feec8f8b"), // Accepted - Participant [Flight II]
          new ObjectId("64f37199dc5faf15feec8f9d"), // Accepted - Participant [Flight III]
        ],
      },
    })
    .toArray();

  const participants: any[] = [];
  for (const doc of res) {
    const participantInfo = [];

    const names = doc.name.split(" ");
    const firstName = names[0];
    const lastName = names[names.length - 1];

    const dateOfBirth = doc.applicationData?.dateOfBirth;
    const dob = new Date(dateOfBirth);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - dob.getFullYear();
    if (
      currentDate.getMonth() < dob.getMonth() ||
      (currentDate.getMonth() === dob.getMonth() && currentDate.getDate() < dob.getDate())
    ) {
      age--;
    }

    // participantInfo.push(doc.name || "N/A");
    participantInfo.push(firstName || "N/A");
    participantInfo.push(lastName || "N/A");
    participantInfo.push(age || "N/A");
    participantInfo.push(doc.email || "N/A");
    participantInfo.push(doc.applicationData?.school.replace(",", "") || "N/A");
    participantInfo.push(doc.applicationData?.phoneNumber || "N/A");
    participantInfo.push(doc.applicationData?.address?.country || "United States");
    participantInfo.push(
      doc.applicationData?.levelOfStudy.replaceAll(",", " |") || "Undergraduate"
    );
    participantInfo.push(doc.applicationData?.schoolYear || "N/A");

    participants.push(participantInfo.join(","));
  }

  participants.unshift(
    "First Name,Last Name,Date of Birth,Email,School,Phone Number,Country,Level Of Study,Year"
  );

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(
      path.resolve(__dirname, "../output/participant_data_mlh.csv"),
      participants.join("\n")
    );
  });

  console.log(`${participants.length - 1} matching applications found`);

  console.info("\nDone.");
})();
