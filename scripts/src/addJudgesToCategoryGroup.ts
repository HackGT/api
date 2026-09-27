/* eslint-disable no-await-in-loop, no-continue */
import { MongoClient, ObjectId } from "mongodb";
import postgres from "postgres";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");
const sql = postgres("postgres://postgres@localhost:5555/expo");

// Set to false to preview what would happen without changing anything
const isRealRun = false;

// Fill these in before running
const HEXATHON_ID = "6a35c6f74d072a2177de9d2e"; // current hexathon
const JUDGE_CONFIRMATION_BRANCH_ID = "REPLACE_WITH_BRANCH_ID"; // judge confirmation branch
const CATEGORY_GROUP_ID = 0; // General Judging category group id (from expo)
const STATUSES = ["CHECKED_IN"];

const addJudgesToCategoryGroup = async () => {
  await client.connect();
  const applications = client.db("registration").collection<any>("applications");

  const [categoryGroup] =
    await sql`SELECT * FROM "category_group" WHERE "id" = ${CATEGORY_GROUP_ID}`;
  if (!categoryGroup) {
    throw new Error(`Category group ${CATEGORY_GROUP_ID} not found`);
  }
  if (categoryGroup.hexathon !== HEXATHON_ID) {
    throw new Error(
      `Category group "${categoryGroup.name}" is for hexathon ${categoryGroup.hexathon}, not ${HEXATHON_ID}`
    );
  }
  console.info(`Adding judges to category group: ${categoryGroup.name}`);

  const judges = await applications
    .find(
      {
        hexathon: new ObjectId(HEXATHON_ID),
        confirmationBranch: new ObjectId(JUDGE_CONFIRMATION_BRANCH_ID),
        status: { $in: STATUSES },
      },
      { projection: { userId: 1, name: 1, email: 1 } }
    )
    .toArray();
  console.info(`Found ${judges.length} judges on the confirmation branch\n`);

  const added: string[] = [];
  const created: string[] = [];
  const alreadyInGroup: string[] = [];
  const inOtherGroup: string[] = [];

  for (const judge of judges) {
    if (!judge.userId || !judge.email) {
      console.warn(`Skipping application ${judge._id}: missing userId or email`);
      continue;
    }

    // Judges who have never logged into Expo don't have a user row yet
    let [user] = await sql`
      SELECT * FROM "user" WHERE "userId" = ${judge.userId} OR "email" = ${judge.email} LIMIT 1
    `;
    if (!user) {
      created.push(judge.email);
      if (isRealRun) {
        [user] = await sql`
          INSERT INTO "user" ("name", "email", "userId")
          VALUES (${judge.name}, ${judge.email}, ${judge.userId})
          RETURNING *
        `;
      } else {
        added.push(judge.email);
        continue;
      }
    }

    // A judge can only be in one category group per hexathon
    const existingGroups = await sql`
      SELECT cg."id", cg."name" FROM "_CategoryGroupToUser" j
      JOIN "category_group" cg ON cg."id" = j."A"
      WHERE j."B" = ${user.id} AND cg."hexathon" = ${HEXATHON_ID}
    `;
    if (existingGroups.some(group => group.id === CATEGORY_GROUP_ID)) {
      alreadyInGroup.push(judge.email);
      continue;
    }
    if (existingGroups.length > 0) {
      inOtherGroup.push(`${judge.email} (in "${existingGroups[0].name}")`);
      continue;
    }

    if (isRealRun) {
      await sql`
        INSERT INTO "_CategoryGroupToUser" ("A", "B")
        VALUES (${CATEGORY_GROUP_ID}, ${user.id})
        ON CONFLICT DO NOTHING
      `;
    }
    added.push(judge.email);
  }

  const prefix = isRealRun ? "" : "[DRY RUN] would have ";
  console.info(`${prefix}created Expo users for ${created.length} judges`);
  console.info(`${prefix}added ${added.length} judges to "${categoryGroup.name}"`);
  added.forEach(email => console.info(`  + ${email}`));
  console.info(`\nAlready in this group: ${alreadyInGroup.length}`);
  console.info(`Skipped, already in another group: ${inOtherGroup.length}`);
  inOtherGroup.forEach(entry => console.info(`  - ${entry}`));
};

(async () => {
  try {
    await addJudgesToCategoryGroup();
  } finally {
    await client.close();
    await sql.end();
  }
  console.info("\nDone.");
})();
