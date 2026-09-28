import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");
const currentHexathon = new ObjectId(
  process.argv[2] || "6a35c6f74d072a2177de9d2e"
);
const outputFilePath = path.resolve(__dirname, "../output/event_interaction_counts.csv");

const escapeCsvField = (field: string | number) => {
  const stringField = String(field);
  return /[",\n\r]/.test(stringField)
    ? `"${stringField.replace(/"/g, '""')}"`
    : stringField;
};

(async () => {
  try {
    await client.connect();

    const db = client.db("hexathons");
    const events = await db
      .collection("events")
      .aggregate<{ name: string; interactionCount: number }>([
        { $match: { hexathon: currentHexathon } },
        {
          $lookup: {
            from: "interactions",
            let: { eventId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$event", "$$eventId"] },
                      { $eq: ["$type", "event"] },
                    ],
                  },
                },
              },
              { $count: "count" },
            ],
            as: "interactions",
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            interactionCount: { $ifNull: [{ $arrayElemAt: ["$interactions.count", 0] }, 0] },
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray();

    const csvRows = ["event name,interaction count"];
    for (const event of events) {
      csvRows.push(`${escapeCsvField(event.name)},${event.interactionCount}`);
    }

    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, csvRows.join("\n"), "utf8");
    console.log(`Success! ${events.length} events written to ${outputFilePath}`);
  } finally {
    await client.close();
  }
})();