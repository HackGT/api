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
  travelType: string,
  travelReimbursementAmount: number
) => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  // Convert strings to objectIds
  const acceptedApplicationsIds = acceptedApplications.map(
    applicationId => new ObjectId(applicationId)
  );
  const waitlistedApplicationsIds = waitlistedApplications.map(
    applicationId => new ObjectId(applicationId)
  );

  // Update accepted applications
  collection.updateMany(
    {
      _id: { $in: acceptedApplicationsIds },
    },
    {
      $set: {
        status: "CONFIRMED",
        decisionData: {
          travelReimbursement: travelType,
          travelReimbursementAmount,
        },
        confirmationBranch: new ObjectId(confirmationBranchId),
      },
    }
  );

  // Waitlist the other applications
  collection.updateMany(
    {
      _id: { $in: waitlistedApplicationsIds },
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
  travelType: string,
  travelReimbursementAmount: number
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
        file.travelType,
        file.travelReimbursementAmount
      )
    )
  );

  console.info("\nDone.");
})();
