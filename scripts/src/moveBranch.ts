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

	// custom for SproutGt 2026
  const criteria = {
    hexathon: new ObjectId("69a5b9df7ecbfa57f8c6f07b"),
    applicationBranch: new ObjectId("69a668b7939388a818c23b0b"),
    applicationData: {
			adult: true,
			confirmChecks: {
        'Hexlabs-Photo-Release-Waiver': true,
        'HexLabs-Privacy-Policy': true
      },
      mlhConfirmations: {
        'MLH-Email-Communication': true,
        'MLH-Privacy-and-Terms': true,
        'MLH-Code-of-Conduct': true
      },
    },
    status: "APPLIED",
  };

  if (isRealRun) {
    const updatedApplications = await collection.updateMany(criteria, {
      $set: {
        status: "ACCEPTED",
        confirmationBranch: new ObjectId("683f9edcd58f3f52fa01c53b"),
      },
    });

    console.log(`${updatedApplications.modifiedCount} application(s) updated`);
  } else {
    const applications = await collection.find(criteria).toArray();
    console.log(`${applications.length} application(s) would be updated`);
  }
};

(async () => {
  await moveBranch();

  console.info("\nDone.");
})();
