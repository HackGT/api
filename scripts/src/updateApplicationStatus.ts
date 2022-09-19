import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const updateApplication = async (
  acceptedApplicationsGeneral: string[], // List of Application Ids
  acceptedApplicationsEmerging: string[], // List of Application Ids
  waitlistedApplications: string[], // List of Application Ids
  confirmationBranchGeneralId: string,
  confirmationBranchEmergingId: string,
  travelType: string,
  travelReimbursementAmount: number,
  travelReimbursementInfoLink: string
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
        status: "ACCEPTED",
        decisionData: {
          travelReimbursement: travelType,
          travelReimbursementAmount,
          travelReimbursementInfoLink,
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
        status: "ACCEPTED",
        decisionData: {
          travelReimbursement: travelType,
          travelReimbursementAmount,
          travelReimbursementInfoLink,
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

  console.log(`${acceptedGeneralRes.modifiedCount} general application(s) accepted`);
  console.log(`${acceptedEmergingRes.modifiedCount} emerging application(s) accepted`);
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
  travelReimbursementInfoLink: string
 }
*/
const APPLICATION_RESULTS = [
  "../input/flight_applications.json",
  "../input/bus_applications.json",
  "../input/gas_applications.json",
];

(async () => {
  await Promise.all(
    APPLICATION_RESULTS.map(fileName => {
      const file = JSON.parse(fs.readFileSync(path.resolve(__dirname, fileName), "utf8"));

      return updateApplication(
        file.acceptedApplicationsGeneral,
        file.acceptedApplicationsEmerging,
        file.waitlistedApplications,
        file.confirmationBranchGeneralId,
        file.confirmationBranchEmergingId,
        file.travelType,
        file.travelReimbursementAmount,
        file.travelReimbursementInfoLink
      );
    })
  );

  console.info("\nDone.");
})();
