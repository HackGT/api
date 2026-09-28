import fs from "fs";
import path from "path";
import postgres from "postgres";

process.on("unhandledRejection", err => {
  throw err;
});

const hexathonId = process.argv[2];
if (!hexathonId) {
  throw new Error("A hexathon ID is required as the first argument");
}

const sql = postgres(
  process.env.POSTGRES_URI_EXPO_SERVICE || "postgres://postgres@localhost:5555/expo"
);
const outputFilePath = path.resolve(__dirname, "../output/category_project_counts.csv");

const escapeCsvField = (field: string | number) => {
  const stringField = String(field);
  return /[",\n\r]/.test(stringField)
    ? `"${stringField.replace(/"/g, '""')}"`
    : stringField;
};

(async () => {
  try {
    const categories = await sql<{ name: string; projectCount: number }[]>`
      SELECT
        c."name",
        COUNT(DISTINCT p."id")::int AS "projectCount"
      FROM "category" c
      LEFT JOIN "_CategoryToProject" cp ON cp."A" = c."id"
      LEFT JOIN "project" p
        ON p."id" = cp."B"
        AND p."hexathon" = c."hexathon"
      WHERE c."hexathon" = ${hexathonId}
      GROUP BY c."id", c."name"
      ORDER BY c."name"
    `;

    const csvRows = ["category name,project count"];
    for (const category of categories) {
      csvRows.push(`${escapeCsvField(category.name)},${category.projectCount}`);
    }

    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, csvRows.join("\n"), "utf8");
    console.log(`Success! ${categories.length} categories written to ${outputFilePath}`);
  } finally {
    await sql.end();
  }
})();