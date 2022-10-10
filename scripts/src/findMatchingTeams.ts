import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

const findMatchingTeams = async () => {
  await client.connect();
  const teamsCollection = client.db("users").collection<any>("teams");
  const applicationsCollection = client.db("registration").collection<any>("applications");

  const allTeams = await teamsCollection
    .find({
      hexathon: new ObjectId("62d9ed68d0a69b88c06bdfb2"),
    })
    .toArray();

  for (const team of allTeams) {
    const numMembers = team.members.length;
    let numAccepted = 0;

    for (const member of team.members) {
      // eslint-disable-next-line no-await-in-loop
      const application = await applicationsCollection.findOne({
        hexathon: new ObjectId("62d9ed68d0a69b88c06bdfb2"),
        userId: member,
      });

      if (application?.status === "ACCEPTED" || application?.status === "CONFIRMED") {
        numAccepted += 1;
      }
    }

    if ((numMembers === 4 && numAccepted === 3) || (numMembers === 3 && numAccepted === 2)) {
      console.log(team._id);
    }
  }
};

(async () => {
  await findMatchingTeams();

  console.info("\nDone.");
})();
