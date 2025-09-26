import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");
const applicationBranchIds = [
  new ObjectId("683f9bb6d58f3f52fa01c515"), // Participant (Early Bird, No Reimbursement)
  new ObjectId("683f9c55d58f3f52fa01c51a"), // Participant (Travel Reimbursement)
  new ObjectId("683fcf83d58f3f52fa01c541"), // Participant (Regular, No Reimbursement)
  new ObjectId("6864951aa334a6b56af14000"), // Priority Application
];

const statuses = ["ACCEPTED", "CONFIRMED"];

(async () => {
  await client.connect();

  const db = client.db("registration");
  const collection = db.collection("applications");

  const res = await collection
    .find({
      status: {
        $in: statuses,
      },
      applicationBranch: {
        $in: applicationBranchIds,
      },
    })
    .toArray();

  console.log(`Found ${res.length} users.`);

  let output =
    "FirstName,LastName,Email,PhoneNumber,DateOfBirth,Country,School,LevelOfStudy,MLHCodeOfConduct,MlhEventLogistics,MLHCommunicationEmails\n";

  for (const app of res) {
    const fullName = app.name.trim().split(" ");
    const firstName = fullName.slice(0, -1).join(" ");
    const lastName = fullName.slice(-1).join(" ");

    const email = app.email || "";
    const phoneNumber = app.applicationData.phoneNumber?.replaceAll(",", "") || "";
    const dateOfBirth = app.applicationData.dateOfBirth?.replaceAll(",", "") || "";
    const country = app.applicationData.countryOfResidence?.replaceAll(",", "") || "";
    const school = app.applicationData.school?.replaceAll(",", "") || "";
    const levelOfStudy = app.applicationData.levelOfStudy?.replaceAll(",", "") || "";
    const mlhCodeOfConduct = app.applicationData?.confirmChecks?.["MLH-Code-Of-Conduct"]
      ? "Yes"
      : "No";
    const mlhEventLogistics = app.applicationData?.confirmChecks?.["MLH-Terms-and-Conditions"]
      ? "Yes"
      : "No";
    const mlhCommunicationEmails = app.applicationData?.confirmChecks?.["MLH-Information-Emails"]
      ? "Yes"
      : "No";

    if (
      !app.applicationData?.confirmChecks ||
      !app.applicationData?.confirmChecks?.["MLH-Code-Of-Conduct"]
    ) {
      console.warn(
        `Warning: Applicant ${firstName} ${lastName} (${email}) has not accepted the MLH Code of Conduct.`
      );
    }

    output += `${firstName},${lastName},${email},${phoneNumber},${dateOfBirth},${country},${school},${levelOfStudy},${mlhCodeOfConduct},${mlhEventLogistics},${mlhCommunicationEmails}\n`;
  }

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(path.resolve(__dirname, "../output/mlhDataHackGT12.csv"), output);
  });

  console.log(`Exported ${res.length} users data`);

  console.info("\nDone.");
})();
