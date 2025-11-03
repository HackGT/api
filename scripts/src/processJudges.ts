import * as fs from "fs";
import * as path from "path";

// Define the type for the data in your JSON file.
// This makes the code more robust and provides better autocompletion.
interface JsonData {
  [key: string]: any; // Allows for any key and value type in the JSON objects
}

/**
 * Reads a JSON file, converts its data to CSV format, and writes it to a new file.
 * * @param jsonFilePath The path to the input JSON file.
 * @param csvFilePath The path for the output CSV file.
 */
function convertJsonToCsv(jsonFilePath: string, csvFilePath: string): void {
  try {
    // 1. Read the JSON file
    const rawData = fs.readFileSync(jsonFilePath, "utf8");
    const jsonData: JsonData[] = JSON.parse(rawData);

    if (jsonData.length === 0) {
      console.log("JSON file is empty. No CSV will be created.");
      return;
    }

    // 2. Get the headers from the keys of the first object
    const data = jsonData[0].users;

    const headers = "name,email";

    // 3. Map each JSON object to a CSV row
    const csvRows = data.map((item: any) => {
      const name = item.name ? `${item.name.replace(/"/g, '""')}` : "";
      const email = item.email ? `${item.email.replace(/"/g, '""')}` : "";
      return `${name},${email}`;
    });
    // 4. Combine headers and rows
    const csvContent = [headers, ...csvRows].join("\n");

    // 5. Write the CSV content to a new file
    fs.writeFileSync(csvFilePath, csvContent, "utf8");

    console.log(
      `Successfully converted JSON to CSV! CSV file is located at: ${path.resolve(csvFilePath)}`
    );
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error(`Error: File not found at ${jsonFilePath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: The file at ${jsonFilePath} is not a valid JSON file.`);
    } else {
      console.error(`An unexpected error occurred: ${error.message}`);
    }
  }
}

// --- Example Usage ---

const inputJsonFile = "../input/judges.json";
const outputCsvFile = "../output/judges.csv";

// Run the conversion function
convertJsonToCsv(inputJsonFile, outputCsvFile);
