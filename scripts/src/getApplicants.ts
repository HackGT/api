import { MongoClient, ObjectId } from "mongodb";
import * as fs from "fs";
 // Import the built-in File System module
const outputFilePath = "applicants.csv"; // Define the output file name

// Throw and show a stack trace on an unhandled Promise rejection
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

/**
 * Escapes a field for CSV formatting.
 * If a field contains a comma, double quote, or newline, it will be enclosed in double quotes.
 * Existing double quotes within the field will be escaped by doubling them.
 * @param {any} field - The data to escape.
 * @returns {string} The CSV-safe string.
 */
const escapeCsvField = (field: string) => {
  // Return an empty string for null or undefined values
  if (field === null || field === undefined) {
    return "";
  }
  const stringField = String(field);
  // Check if the field contains characters that need escaping
  if (/[",\n\r]/.test(stringField)) {
    const escapedField = stringField.replace(/"/g, '""');
    return `"${escapedField}"`;
  }
  return stringField;
};

const exportApplicantsToCsv = async () => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  console.log("Fetching applicants...");

  // Use a projection to retrieve only the necessary fields

  // Find all documents in the collection with the specified projection
  const applicants = await collection
    .find({
      hexathon: new ObjectId("683f9a9ab75ad31cd0f2ec67"),
      applicationBranch: { $in: applicationBranchIds },
      status: {
        $ne: "DRAFT",
      },
    })
    .toArray();

  // 1. Start with the header row
  const headers = ["name", "country", "school"];
  const csvRows = [headers.join(",")];

  // 2. Add each applicant as a new CSV row
  applicants.forEach(applicant => {
    const row = [
      escapeCsvField(applicant.name),
      escapeCsvField(applicant.applicationData.countryOfResidence),
      escapeCsvField(applicant.applicationData.school),
    ];
    csvRows.push(row.join(","));
  });

  // 3. Join all rows with a newline character to form the final CSV content
  const csvContent = csvRows.join("\n");

  // 4. Write the content to the specified file
  try {
    fs.writeFileSync(outputFilePath, csvContent);
    console.log(`✅ Success! ${applicants.length} records written to ${outputFilePath}`);
  } catch (error) {
    console.error("❌ Error writing to file:", error);
  }
};

(async () => {
  try {
    await exportApplicantsToCsv();
    // Use console.error for info message so it doesn't mix with CSV output
  } catch (err) {
    console.error("\nAn error occurred:", err);
  } finally {
    // Ensure the client is closed when the script finishes or errors out
    await client.close();
  }
})();
