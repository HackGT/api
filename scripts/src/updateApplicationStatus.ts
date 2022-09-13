import config from "@api/config";
import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient(config.database.mongo.uri);

const updateApplication = async (
  acceptedApplicationsGeneral: string[], // List of Application Ids
  acceptedApplicationsEmerging: string[], // List of Application Ids
  waitlistedApplications: string[], // List of Application Ids
  confirmationBranchGeneralId: string,
  confirmationBranchEmergingId: string,
  travelType: string,
  travelReimbursementAmount: number
) => {
  await client.connect();
  const db = client.db("registration");
  const collection = db.collection<any>("applications");

  // Convert strings to objectIds
  const acceptedGeneralIds = acceptedApplicationsGeneral.map(
    applicationId => new ObjectId(applicationId)
  );
  const acceptedEmergingIds = acceptedApplicationsEmerging.map(
    applicationId => new ObjectId(applicationId)
  );
  const waitlistedApplicationsIds = waitlistedApplications.map(
    applicationId => new ObjectId(applicationId)
  );

  // Update accepted general applications
  const acceptedGeneralRes = await collection.updateMany(
    {
      _id: { $in: acceptedGeneralIds },
    },
    {
      $set: {
        status: "CONFIRMED",
        decisionData: {
          travelReimbursement: travelType,
          travelReimbursementAmount,
        },
        confirmationBranch: new ObjectId(confirmationBranchGeneralId),
      },
    }
  );

  // Update accepted emerging applications
  const acceptedEmergingRes = await collection.updateMany(
    {
      _id: { $in: acceptedEmergingIds },
    },
    {
      $set: {
        status: "CONFIRMED",
        decisionData: {
          travelReimbursement: travelType,
          travelReimbursementAmount,
        },
        confirmationBranch: new ObjectId(confirmationBranchEmergingId),
      },
    }
  );

  // Waitlist the other applications
  const waitlistedRes = await collection.updateMany(
    {
      _id: { $in: waitlistedApplicationsIds },
    },
    {
      $set: {
        status: "WAITLISTED",
      },
    }
  );

  console.log(`${acceptedGeneralRes.modifiedCount} application(s) accepted`);
  console.log(`${acceptedEmergingRes.modifiedCount} application(s) accepted`);
  console.log(`${waitlistedRes.modifiedCount} application(s) waitlisted`);
  console.log(
    `${
      acceptedGeneralRes.modifiedCount +
      acceptedEmergingRes.modifiedCount +
      waitlistedRes.modifiedCount
    } total application(s) updated`
  );
};

/*
 Each file is of the form:
 {
  acceptedApplicationsGeneral: string[],
  acceptedApplicationsEmerging: string[],
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
        file.acceptedApplicationsGeneral,
        file.acceptedApplicationsEmerging,
        file.waitlistedApplications,
        file.confirmationBranchGeneralId,
        file.confirmationBranchEmergingId,
        file.travelType,
        file.travelReimbursementAmount
      )
    )
  );

  console.info("\nDone.");
})();
