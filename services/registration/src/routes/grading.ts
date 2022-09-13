/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { Types } from "mongoose";

import { getScoreMapping } from "../common/mapScores";
import { ApplicationModel, Essay, StatusType } from "../models/application";
import { GraderModel } from "../models/grader";
import { Review, ReviewModel } from "../models/review";
import { BranchModel, BranchType, GradingGroupType } from "../models/branch";
import { calibrationQuestionMapping, rubricMapping } from "../config";

const MAX_REVIEWS_PER_ESSAY = 2;

type AggregatedEssay = {
  applicationId: string;
  applicationBranch: string;
  essay: Essay;
  numReviews: number;
  reviews: Review[];
};

export const gradingRouter = express.Router();

/*
  The purpose of this route is to get a grader's response to a specific question.
  Takes in email of someone who is grading the application (req.grader)
  -> Checks if needs to do calibration questions (first-time graders have to do these) (keep returning these until all are answered)
  -> checks groups -> return questions to grade
*/
gradingRouter.route("/actions/retrieve-question").post(
  checkAbility("create", "Grader"),
  asyncHandler(async (req, res) => {
    if (!req.user || !req.user.email) {
      throw new BadRequestError("User email is required");
    }
    if (!req.body.hexathon) {
      throw new BadRequestError("Hexathon field is required in body");
    }
    if (
      !req.body.gradingGroup ||
      !Object.values(GradingGroupType).includes(req.body.gradingGroup)
    ) {
      throw new BadRequestError("Valid grading group is required in body");
    }

    let grader = await GraderModel.accessibleBy(req.ability).findOne({
      userId: req.user.uid,
      hexathon: req.body.hexathon,
    });

    // First-time grader -> so get initial grading group & give calibration questions
    if (!grader) {
      grader = await GraderModel.create({
        userId: req.user.uid,
        hexathon: req.body.hexathon,
        email: req.user.email,
        calibrationScores: [],
        calibrationMapping: null,
      });
    }

    if (!calibrationQuestionMapping[req.body.gradingGroup]) {
      throw new BadRequestError(
        "Config is not in correct format. Grader's group name does not exist"
      );
    }

    const numCalibrationQuestionsForGroup = grader.calibrationScores.filter(
      score => score.group === req.body.gradingGroup
    ).length;

    let isCalibrationQuestion = false;
    let calibrationQuestion: any | undefined;
    let applicationQuestion: AggregatedEssay | undefined;
    if (
      numCalibrationQuestionsForGroup < calibrationQuestionMapping[req.body.gradingGroup].length
    ) {
      isCalibrationQuestion = true;
      calibrationQuestion =
        calibrationQuestionMapping[req.body.gradingGroup][numCalibrationQuestionsForGroup];
    } else {
      // Get the list of branches that match the grading group
      const databaseBranches = await BranchModel.find({
        hexathon: req.body.hexathon,
        grading: {
          enabled: true,
          group: req.body.gradingGroup,
        },
        type: BranchType.APPLICATION,
      });
      if (databaseBranches.length === 0) {
        throw new BadRequestError(
          "No branches are currently available for grading. Please try again later."
        );
      }

      const validEssays: AggregatedEssay[] = await ApplicationModel.aggregate([
        {
          $match: {
            status: StatusType.APPLIED,
            gradingComplete: false,
            applicationBranch: {
              $in: databaseBranches.map(branch => branch._id),
            },
            hexathon: new Types.ObjectId(req.body.hexathon),
          },
        },
        {
          $unwind: "$applicationData.essays",
        },
        {
          $project: {
            applicationId: "$_id",
            applicationBranch: "$applicationBranch",
            essay: "$applicationData.essays",
            _id: false,
          },
        },
        {
          $lookup: {
            from: "reviews",
            localField: "essay._id",
            foreignField: "essayId",
            as: "reviews",
          },
        },
        {
          $addFields: {
            numReviews: {
              $size: "$reviews",
            },
          },
        },
        {
          $match: {
            "reviews.reviewerId": {
              $ne: grader.userId,
            },
            "numReviews": {
              $lt: MAX_REVIEWS_PER_ESSAY,
            },
          },
        },
      ]);

      if (validEssays.length === 0) {
        throw new BadRequestError(
          "All essays have been graded for this grading group. Please try another one."
        );
      }

      // Set the response to a random essay from the valid essays retrieved
      applicationQuestion = validEssays[Math.floor(Math.random() * validEssays.length)];
    }

    // Set criteria based on if calibration question or not
    const criteria = isCalibrationQuestion
      ? calibrationQuestion.criteria
      : applicationQuestion?.essay.criteria;

    // Retrive rubric link and grading rubric from the rubric mapping config
    const { question, rubricLink, gradingRubric } = rubricMapping[criteria];

    let response;
    if (isCalibrationQuestion) {
      response = {
        essayId: calibrationQuestion.id,
        branch: calibrationQuestion.branch,
        criteria: calibrationQuestion.criteria,
        question,
        answer: calibrationQuestion.answer,
        rubricLink,
        gradingRubric,
        isCalibrationQuestion,
      };
    } else {
      const branchName = (await BranchModel.findById(applicationQuestion?.applicationBranch))?.name;
      response = {
        applicationId: applicationQuestion?.applicationId,
        essayId: applicationQuestion?.essay._id,
        branch: branchName,
        criteria: applicationQuestion?.essay.criteria,
        question,
        answer: applicationQuestion?.essay.answer,
        rubricLink,
        gradingRubric,
        isCalibrationQuestion,
      };
    }

    return res.status(200).send(response);
  })
);

// /graded takes care of submitting the review
gradingRouter.route("/actions/submit-review").post(
  checkAbility("create", "Review"),
  asyncHandler(async (req, res) => {
    const grader = await GraderModel.accessibleBy(req.ability).findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    });
    if (!grader) {
      throw new BadRequestError("Grader does not exist in database");
    }

    if (!calibrationQuestionMapping[req.body.gradingGroup]) {
      throw new BadRequestError("Group Config is incorrectly formatted. Group name is incorrect");
    }

    if (!req.body.score || !req.body.essayId) {
      throw new BadRequestError("One or more of the method body arguments is missing.");
    }

    const numCalibrationScoresForGroup = grader.calibrationScores.filter(
      val => val.group === req.body.gradingGroup
    ).length;

    // Checks to make sure the user has completed all the calibration questions and that this request
    // is for a calibration question
    if (
      numCalibrationScoresForGroup < calibrationQuestionMapping[req.body.gradingGroup].length &&
      (!req.body.isCalibrationQuestion || req.body.applicationId)
    ) {
      throw new BadRequestError(
        "Cannot submit a score for this group yet. Calibration questions are not complete."
      );
    }

    if (numCalibrationScoresForGroup < calibrationQuestionMapping[req.body.gradingGroup].length) {
      grader.calibrationScores.push({
        group: req.body.gradingGroup,
        score: req.body.score,
      });

      // If this was the last calibration score submitted, compute this user's calibration
      // score mapping and save to database
      // if (
      //   numCalibrationScoresForGroup ===
      //   calibrationQuestionMapping[currentGradingGroup].length - 1
      // ) {
      //   grader.calibrationMapping = await getScoreMapping(grader.calibrationScores);
      // }
    } else {
      // Submit grading for an application
      const application = await ApplicationModel.findById(req.body.applicationId);
      if (!application) {
        throw new BadRequestError("No application found with provided applicationId");
      }

      const essay = application.applicationData.essays?.id(req.body.essayId);
      if (!essay) {
        throw new BadRequestError("No essay found with provided essayId");
      }

      // TODO: Calibration score mapping needs to be fixed

      // const scoreMappings = grader.calibrationMapping.find(
      //   mapping => mapping.criteria === essay.criteria
      // )?.scoreMappings;
      // if (!scoreMappings) {
      //   throw new BadRequestError("No calibration mapping found for this criteria.");
      // }

      // const adjustedScore = scoreMappings[parseInt(req.body.score)];

      await ReviewModel.create({
        reviewerId: grader.userId,
        hexathon: req.body.hexathon,
        applicationId: req.body.applicationId,
        essayId: req.body.essayId,
        score: req.body.score,
        timestamp: new Date(),
        // adjustedScore,
      });

      // TODO: Needs to be fixed up, as all the essays need to be scored first
      // const allEssayReviews = await ReviewModel.find({
      //   essayId: req.body.essayId,
      // });
      // if (allEssayReviews.length >= MAX_REVIEWS_PER_ESSAY) {
      //   application.gradingComplete = true;
      //   const sumScores = allEssayReviews.reduce((prev, review) => prev + review.adjustedScore, 0);
      //   application.finalScore = sumScores / allEssayReviews.length;
      //   await application.save();
      // }

      grader.graded += 1;
    }

    await grader.save();
    return res.sendStatus(201);
  })
);

gradingRouter.route("/actions/skip-question").post(
  checkAbility("update", "Grader"),
  asyncHandler(async (req, res) => {
    const grader = await GraderModel.accessibleBy(req.ability).findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    });

    if (!grader) {
      throw new BadRequestError("Grader does not exist in database");
    }

    grader.skipped += 1;
    await grader.save();

    return res.sendStatus(201);
  })
);

gradingRouter.route('/leaderboard-statistics').get(
  checkAbility("aggregate", "Review"),
  asyncHandler(async (req, res) => {
    const hexathon = req.params.id;
    if (!hexathon) {
      throw new BadRequestError("Hexathon field is required in header");
    }
    // Aggregate graded applications from mongodb
    const gradedApplications: any[] = await ApplicationModel.aggregate([
      {
        // Matches the hexathon and that it is a completed application
        $match: {
          hexathon: new Types.ObjectId(hexathon),
          status: "APPLIED",
        },
      },
      {
        // joins the reviews collection on the applicationId field
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "applicationId",
          as: "reviews_data",
        },
      },
      {
        // spreads the reviews_data to un-nest the array
        $unwind: {
          path: "$reviews_data",
          includeArrayIndex: "string",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        // groups the data by id and calculates average score
        $group: {
          _id: "$_id",
          userId: {
            $first: "$userId",
          },
          applicationBranch: {
            $first: "$applicationBranch",
          },
          applicationData: {
            $first: "$applicationData",
          },
          essayId: {
            $first: "$reviews_data.essayId",
          },
          avgScore: {
            $avg: "$reviews_data.score",
          },
          numReviews: {
            $sum: 1,
          },
        },
      },
      {
        // joins the branches collection on applicationBranch
        $lookup: {
          from: "branches",
          localField: "applicationBranch",
          foreignField: "_id",
          as: "branches_data",
        },
      },
      {
        // Spreads the branches_data array to un-nest the array
        $unwind: {
          path: "$branches_data",
          includeArrayIndex: "string",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        // Groups final data and returns necessary fields
        $group: {
          _id: "$_id",
          userId: {
            $first: "$userId",
          },
          branchId: {
            $first: "$applicationBranch",
          },
          branchName: {
            $first: "$branches_data.name",
          },
          school: {
            $first: "$applicationData.school",
          },
          essayId: {
            $first: "$essayId",
          },
          avgScore: {
            $first: "$avgScore",
          },
          numReviews: {
            $first: "$numReviews",
          },
          gender: {
            $first: "$applicationData.gender",
          },
          ethnicity: {
            $first: "$applicationData.ethnicity",
          },
          travelReimbursementType: {
            $first: "$applicationData.travelReimbursement",
          },
        },
      },
    ]);
    return res.status(200).send(gradedApplications);
  })
)

gradingRouter.route("/leaderboard").get(
  checkAbility("read", "Grader"),
  asyncHandler(async (req, res) => {
    const currentGrader = await GraderModel.accessibleBy(req.ability).findOne({
      userId: req.user?.uid,
    });

    // Get top 10 graders in descending order (top grader first)
    const topGraders = await GraderModel.accessibleBy(req.ability)
      .find({ hexathon: req.query.hexathon })
      .sort({ graded: -1 });

    // If there are no graders, send empty response
    if (topGraders.length === 0) {
      res.status(200).send({ currentNumGraded: currentGrader?.graded ?? 0, leaderboard: [] });
    }

    const users = await apiCall(
      Service.USERS,
      {
        url: "/users/actions/retrieve",
        method: "POST",
        data: {
          userIds: topGraders.map(grader => grader.userId),
        },
      },
      req
    );

    const leaderboard = [];

    for (const grader of topGraders) {
      const userProfile = users.find((user: any) => user.userId === grader.userId);
      if (userProfile) {
        const name = `${userProfile.name.first} ${userProfile.name.last}`;
        leaderboard.push({
          name,
          numGraded: grader.graded,
        });
      }
    }

    return res.status(200).send({ currentNumGraded: currentGrader?.graded ?? 0, leaderboard });
  })
);

gradingRouter.route("/export-grading/:id").get(
  checkAbility("aggregate", "Review"),
  asyncHandler(async (req, res) => {
    const hexathon = req.params.id;

    if (!hexathon) {
      throw new BadRequestError("Hexathon field is required in header");
    }

    // Aggregate graded applications from mongodb
    const gradedApplications: any[] = await ApplicationModel.aggregate([
      {
        // Matches the hexathon and that it is a completed application
        $match: {
          hexathon: new Types.ObjectId(hexathon),
          status: "APPLIED",
        },
      },
      {
        // joins the reviews collection on the applicationId field
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "applicationId",
          as: "reviews_data",
        },
      },
      {
        // spreads the reviews_data to un-nest the array
        $unwind: {
          path: "$reviews_data",
          includeArrayIndex: "string",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        // groups the data by id and calculates average score
        $group: {
          _id: "$_id",
          userId: {
            $first: "$userId",
          },
          applicationBranch: {
            $first: "$applicationBranch",
          },
          applicationData: {
            $first: "$applicationData",
          },
          essayId: {
            $first: "$reviews_data.essayId",
          },
          avgScore: {
            $avg: "$reviews_data.score",
          },
          numReviews: {
            $sum: 1,
          },
        },
      },
      {
        // joins the branches collection on applicationBranch
        $lookup: {
          from: "branches",
          localField: "applicationBranch",
          foreignField: "_id",
          as: "branches_data",
        },
      },
      {
        // Spreads the branches_data array to un-nest the array
        $unwind: {
          path: "$branches_data",
          includeArrayIndex: "string",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        // Groups final data and returns necessary fields
        $group: {
          _id: "$_id",
          userId: {
            $first: "$userId",
          },
          branchId: {
            $first: "$applicationBranch",
          },
          branchName: {
            $first: "$branches_data.name",
          },
          school: {
            $first: "$applicationData.school",
          },
          essayId: {
            $first: "$essayId",
          },
          avgScore: {
            $first: "$avgScore",
          },
          numReviews: {
            $first: "$numReviews",
          },
          gender: {
            $first: "$applicationData.gender",
          },
          ethnicity: {
            $first: "$applicationData.ethnicity",
          },
          travelReimbursementType: {
            $first: "$applicationData.travelReimbursement",
          },
        },
      },
    ]);

    // Create a comma separated string with all the data
    let combinedApplications =
      "applicationId; userId; branchId; branchName; school; essayId; avgScore; numReviews; gender; ethnicity, travelReimbursementType\n";

    gradedApplications.forEach(appl => {
      for (const field of Object.keys(appl)) {
        combinedApplications += `${appl[field]};`;
      }
      combinedApplications += "\n";
    });
    res.header("Content-Type", "text/csv");
    return res.status(200).send(combinedApplications);
  })
);
