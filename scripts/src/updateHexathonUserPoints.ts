/* eslint-disable no-await-in-loop */
import { MongoClient, ObjectId } from "mongodb";

// --- Configuration ---
// The hexathon ID to process.
const HEXATHON_ID_STRING = "683f9a9ab75ad31cd0f2ec67";
const MONGODB_URI = "mongodb://localhost:7777";
const DATABASE_NAME = "hexathons";

// --- Point System Definitions ---
const EVENT_TYPE_POINTS = {
  "food": 0,
  "workshop": 30,
  "ceremony": 0,
  "tech-talk": 40,
  "mini-event": 10,
  "important": 0,
  "speaker": 40,
  "mini-challenge": 40, // sponsor events at HackGT 12
  "important-workshop": 100,
  "main-event": 50, // Museum event at HackGT 12
  "performance": 15,
};

// These values should match the enums and constants in your main application.
enum EventType {
  FOOD = "food",
  WORKSHOP = "workshop",
  CEREMONY = "ceremony",
  TECH_TALK = "tech-talk",
  MINI_EVENT = "mini-event",
  IMPORTANT = "important",
  SPEAKER = "speaker",
  MINI_CHALLENGE = "mini-challenge",
  IMPORTANT_WORKSHOP = "important-workshop",
  MAIN_EVENT = "main-event",
  PERFORMANCE = "performance",
}

enum InteractionType {
  EVENT = "event",
  SCAVENGER_HUNT = "scavenger-hunt",
  EXPO_SUBMISSION = "expo-submission",
  CHECK_IN = "check-in",
}

// Throw and show a stack trace on an unhandled Promise rejection
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient(MONGODB_URI);

const updateUserPoints = async () => {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB.");

    const db = client.db(DATABASE_NAME);
    const hexathonUsersCollection = db.collection("hexathonusers");
    const interactionsCollection = db.collection("interactions");
    const HEXATHON_ID = new ObjectId(HEXATHON_ID_STRING);

    const checkedInUserIds = await client
      .db("registration")
      .collection("applications")
      .distinct("userId", {
        hexathon: HEXATHON_ID,
        status: "CHECKED_IN",
      });
    console.log(`Found ${checkedInUserIds.length} checked in users from registration database.`);

    // 1. Find all users for the specified hexathon
    const usersToUpdate = await hexathonUsersCollection
      .find({
        hexathon: HEXATHON_ID,
        userId: { $in: checkedInUserIds },
      })
      .toArray();

    if (usersToUpdate.length === 0) {
      console.log(`No users found for hexathon ID: ${HEXATHON_ID_STRING}. Exiting.`);
      return;
    }

    console.log(`Found ${usersToUpdate.length} users to update.`);
    let count = 0;

    // 2. Loop through each user to update their points
    for (const user of usersToUpdate) {
      // 3. Find all interactions for the user, populating the event data using an aggregation pipeline
      const interactions = await interactionsCollection
        .aggregate([
          {
            $match: {
              userId: user.userId,
              hexathon: HEXATHON_ID,
            },
          },
          {
            $lookup: {
              // This mimics mongoose.populate('event')
              from: "events",
              localField: "event",
              foreignField: "_id",
              as: "eventDetails",
            },
          },
          {
            // Deconstruct the eventDetails array to make it a single object
            $unwind: {
              path: "$eventDetails",
              preserveNullAndEmptyArrays: true, // Keep interactions that might not have an event linked
            },
          },
          // Rename 'eventDetails' to 'event' to match the original function's structure
          { $addFields: { event: "$eventDetails" } },
          { $project: { eventDetails: 0 } }, // Clean up the old field
        ])
        .toArray();

      // 4. Calculate points based on the same logic as the original function
      const points = interactions.reduce((total, interaction) => {
        if (
          interaction.type === InteractionType.EVENT &&
          interaction.event?.type &&
          Object.values(EventType).includes(interaction.event.type)
        ) {
          return total + (EVENT_TYPE_POINTS[interaction.event.type as EventType] || 0);
        }
        if (interaction.type === InteractionType.SCAVENGER_HUNT) {
          return total + 20;
        }
        if (interaction.type === InteractionType.EXPO_SUBMISSION) {
          return total + 250;
        }
        return total;
      }, 0);

      // 5. Update the user's points in the database
      await hexathonUsersCollection.updateOne(
        {
          _id: user._id, // Use the unique document ID for updating
        },
        {
          $set: {
            "points.numCollected": points,
            "points.updatedAt": new Date(),
          },
        }
      );

      console.log(`Updated user ${user.userId} (${count}): ${points} points.`);
      count++;
    }
  } catch (error) {
    console.error("An error occurred during the script execution:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
};

(async () => {
  await updateUserPoints();
  console.info("\nDone.");
})();
