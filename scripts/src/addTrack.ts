import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const moveBranch = async () => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  const isRealRun = true;

  const criteria = {
    hexathon: new ObjectId("683f9a9ab75ad31cd0f2ec67"),
    _id: new ObjectId("68d890389030047d80020e25"),
  };

  if (isRealRun) {
    const updatedApplications = await collection.updateOne(criteria, {
      $set: {
        applicationData: {
          customData: {
            track: "General",
          },
        },
      },
    });

    console.log(`${updatedApplications.modifiedCount} application(s) updated`);
  } else {
    const applications = await collection.count(criteria);
    console.log(`${applications} application(s) would be updated`);
  }
};

(async () => {
  await moveBranch();

  console.info("\nDone.");
})();
