/* eslint-disable no-await-in-loop */
import postgres from "postgres";
import fs from "fs";
import path from "path";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const FILE_NAME = "Expo User Data.json";

const sql = postgres("postgres://postgres@localhost:5555/expo");

const writeUserData = async () => {
  const users = await sql`SELECT * FROM "user" WHERE "categoryGroupId" IS NOT NULL`;

  fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true }, err => {
    if (err) throw err;

    fs.writeFileSync(path.resolve(__dirname, `../output/${FILE_NAME}`), JSON.stringify(users));
  });
};

const writeCategoryGroupData = async () => {
  let userData;
  try {
    const userFileData = fs.readFileSync(path.resolve(__dirname, `../output/${FILE_NAME}`), "utf8");
    userData = JSON.parse(userFileData);
  } catch (error) {
    throw new Error(`Unable to read ${FILE_NAME}`);
  }

  for (const user of userData) {
    await sql`INSERT INTO "_CategoryGroupToUser" ("A", "B") VALUES (${user.categoryGroupId}, ${user.id})`;
  }
};

(async () => {
  // await writeUserData();
  await writeCategoryGroupData();

  console.info("\nDone.");
})();
