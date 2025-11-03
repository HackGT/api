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
      hexathon: new ObjectId("683f9a9ab75ad31cd0f2ec67"),
      status: "CHECKED_IN",
    })
    .toArray();

  console.log(res[5]);

  console.log(`Found ${res.length} users.`);

  let output = "Name,Email,GradYear,LinkedInUrl,GitHubOrPersonalWebsiteUrl\n";

  for (const app of res) {
    const fullName = app.name;
    const email = app.email || "";
    const schoolYear = app.applicationData.schoolYear?.replaceAll(",", "") || "";
    const linkedinUrl = app.applicationData.linkedin || "";
    const website = app.applicationData.website || "";

    output += `${fullName},${email},${schoolYear},${linkedinUrl},${website}\n`;
  }

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(path.resolve(__dirname, "../output/sponsorData.csv"), output);
  });

  console.log(`Exported ${res.length} users data`);

  console.info("\nDone.");
})();
