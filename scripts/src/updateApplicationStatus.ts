import config from "@api/config";
import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient(config.database.mongo.uri);

const updateApplication = async (
  acceptedApplications: string[], // List of Application Ids
  waitlistedApplications: string[], // List of Application Ids
  confirmationBranchId: string,
  travelType: string
) => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  // Update accepted applications
  collection.updateMany(
    {
      _id: { $in: acceptedApplications },
    },
    {
      $set: {
        status: "CONFIRMED",
        decisionData: {
          travelReimbursement: travelType,
          travelReimbursementAmount: 200,
        },
        confirmationBranch: new ObjectId(confirmationBranchId),
      },
    }
  );

  // Waitlist the other applications
  collection.updateMany(
    {
      _id: { $in: waitlistedApplications },
    },
    {
      $set: {
        status: "WAITLISTED",
      },
    }
  );
};

/*
 Each file is of the form:
 {
  acceptedApplications: string[],
  waitlistedApplications: string[],
  confirmationBranchId: string,
  travelType: string
 }
*/
const APPLICATION_RESULTS = [
  "../../services/registration/src/config/flight_applications.json",
  "../../services/registration/src/config/bus_applications.json",
  "../../services/registration/src/config/gas_applications.json",
];

(async () => {
  await Promise.all(
    APPLICATION_RESULTS.map((file: any) =>
      updateApplication(
        file.acceptedApplications,
        file.waitlistedApplications,
        file.confirmationBranchId,
        file.travelType
      )
    )
  );

  console.info("\nDone.");
})();
