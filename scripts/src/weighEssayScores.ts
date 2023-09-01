/* eslint-disable no-await-in-loop */
import { MongoClient, ObjectId } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new MongoClient("mongodb://localhost:7777");

// HACKGT X Essay Criterias
const essayWeights: Record<string, number> = {
  Aspiration: 2,
  Experience: 3,
  Learning: 3,
  Creativity: 1,
};

const weighEssayScores = async () => {
  await client.connect();
  const applicationsCollection = client.db("registration").collection<any>("applications");
  const reviewsCollection = client.db("registration").collection<any>("reviews");
  const gradedApplications = await applicationsCollection.find({
    hexathon: new ObjectId("647fee51768e521dc8ef88e0"),
    applicationBranch: new ObjectId("648a61d51108c92028412df0"),
    status: "APPLIED",
    gradingComplete: true,
  });
  let updatedApplications = 0;
  for await (const application of gradedApplications) {
    try {
      let totalEssayWeight = 0;
      let weightedFinalScore = 0;
      // Get essay reviews for this application
      const essayReviews = await reviewsCollection.find({
        hexathon: new ObjectId("647fee51768e521dc8ef88e0"),
        applicationId: application._id,
      });

      for await (const essayReview of essayReviews) {
        const essay = application.applicationData.essays.find(
          (essay: any) => essay._id.toString() === essayReview.essayId.toString()
        );
        if (!essay) {
          weightedFinalScore += (essayReview.adjustedScore * (2 + 3 + 3 + 1)) / 4;
          totalEssayWeight += (2 + 3 + 3 + 1) / 4;
        } else {
          weightedFinalScore += essayReview.adjustedScore * essayWeights[essay.criteria];
          totalEssayWeight += essayWeights[essay.criteria];
        }
      }

      if (totalEssayWeight && weightedFinalScore) weightedFinalScore /= totalEssayWeight;

      await applicationsCollection.updateOne(
        { _id: application._id },
        {
          $set: {
            finalScore: weightedFinalScore,
          },
        }
      );
      updatedApplications++;
    } catch (err: any) {
      console.log(err.message);
    }
  }

  console.log(`Updated ${updatedApplications} application(s) with weighted final scores`);
};

(async () => {
  await weighEssayScores();

  console.info("\nDone.");
})();
