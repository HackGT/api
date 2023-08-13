/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { Types } from "mongoose";
import _ from "lodash";

import { ApplicationModel, Essay, StatusType } from "../models/application";
import { GraderModel } from "../models/grader";
import { Review, ReviewModel } from "../models/review";
import { BranchModel, BranchType, GradingGroupType } from "../models/branch";
import { calibrationQuestionMapping, rubricMapping } from "../config";
import { getCalibrationMapping } from "../common/adjustScores";

const MAX_REVIEWS_PER_ESSAY = 2;
// NOTE: No. of essays for each application. As such, will need to be updated whenever we add/remove essays.
const ESSAY_COUNT = 4;

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

    const gradingGroup = req.body.gradingGroup as GradingGroupType;

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
        calibrationScores: [
          {
            group: gradingGroup,
            criteriaScores: [],
          },
        ],
        calibrationMapping: null,
      });
    }

    if (!calibrationQuestionMapping[gradingGroup]) {
      throw new BadRequestError(
        "Config is not in correct format. Grader's group name does not exist"
      );
    }

    const criteriaScores = grader.calibrationScores.find(
      calibrationScore => calibrationScore.group === gradingGroup
    )?.criteriaScores;

    const numCalibrationScoresForGroup = criteriaScores ? criteriaScores.length : 0;

    let isCalibrationQuestion = false;
    let calibrationQuestion: any | undefined;
    let applicationQuestion: AggregatedEssay | undefined;

    if (numCalibrationScoresForGroup < calibrationQuestionMapping[gradingGroup].length) {
      isCalibrationQuestion = true;
      calibrationQuestion = calibrationQuestionMapping[gradingGroup][numCalibrationScoresForGroup];
    } else {
      // Get the list of branches that match the grading group
      const databaseBranches = await BranchModel.find({
        hexathon: req.body.hexathon,
        grading: {
          enabled: true,
          group: gradingGroup,
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

    // Retrieve rubric link and grading rubric from the rubric mapping config
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

    const gradingGroup = req.body.gradingGroup as GradingGroupType;

    let criteriaScores = grader.calibrationScores.find(
      calibrationScore => calibrationScore.group === gradingGroup
    )?.criteriaScores;

    const numCalibrationScoresForGroup = criteriaScores ? criteriaScores.length : 0;

    // Checks to make sure the user has completed all the calibration questions and that this request
    // is for a calibration question
    if (
      numCalibrationScoresForGroup < calibrationQuestionMapping[gradingGroup].length &&
      (!req.body.isCalibrationQuestion || req.body.applicationId)
    ) {
      throw new BadRequestError(
        "Cannot submit a score for this group yet. Calibration questions are not complete."
      );
    }

    if (numCalibrationScoresForGroup < calibrationQuestionMapping[gradingGroup].length) {
      if (!criteriaScores) {
        criteriaScores = [];
        grader.calibrationScores.push({
          group: gradingGroup,
          criteriaScores,
        });
      }
      criteriaScores.push({
        criteria: req.body.criteria,
        score: req.body.score,
      });

      // If this was the last calibration score submitted, compute this user's calibration
      // score mapping and save to database
      if (
        numCalibrationScoresForGroup ===
        calibrationQuestionMapping[req.body.gradingGroup].length - 1
      ) {
        grader.calibrationMapping = await getCalibrationMapping(criteriaScores, gradingGroup);
      }
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

      let adjustedScore = req.body.score;
      const scoreMappings = grader.calibrationMapping.find(
        mapping => mapping.criteria === essay.criteria
      )?.scoreMappings;

      if (scoreMappings) {
        adjustedScore = scoreMappings.get(req.body.score.toString());
      }

      await ReviewModel.create({
        reviewerId: grader.userId,
        hexathon: req.body.hexathon,
        applicationId: req.body.applicationId,
        essayId: req.body.essayId,
        score: req.body.score,
        timestamp: new Date(),
        adjustedScore,
      });

      const allEssayReviews = await ReviewModel.find({
        applicationId: { $eq: req.body.applicationId },
      });

      // If all essays have been graded, compute the final score and mark the application as graded
      if (allEssayReviews.length >= MAX_REVIEWS_PER_ESSAY * ESSAY_COUNT) {
        application.gradingComplete = true;
        const sumScores = allEssayReviews.reduce((prev, review) => prev + review.adjustedScore, 0);
        application.finalScore = sumScores / allEssayReviews.length;
        await application.save();
      }

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

gradingRouter.route("/leaderboard").get(
  checkAbility("read", "Grader"),
  asyncHandler(async (req, res) => {
    const currentGrader = await GraderModel.accessibleBy(req.ability).findOne({
      userId: req.user?.uid,
    });

    // Get top 10 graders (or 100 if exec) in descending order (top graders first)
    const topGraders = await GraderModel.accessibleBy(req.ability)
      .find({ hexathon: req.query.hexathon })
      .sort({ graded: -1 })
      .limit(req.user?.roles.exec ? 100 : 10);

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

gradingRouter.route("/export").get(
  checkAbility("aggregate", "Review"),
  asyncHandler(async (req, res) => {
    const hexathon = req.query.hexathon as string;
    if (!hexathon) {
      throw new BadRequestError("Hexathon field is required in query parameters");
    }

    // Aggregate graded applications from mongodb
    const gradedApplications: any[] = await ApplicationModel.aggregate([
      {
        // Matches the hexathon and that it is a completed application
        $match: {
          hexathon: new Types.ObjectId(hexathon),
          status: { $ne: StatusType.DRAFT },
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
          status: {
            $first: "$status",
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
          status: {
            $first: "$status",
          },
        },
      },
    ]);

    // Create a comma separated string with all the data
    let combinedApplications =
      "applicationId; userId; branchId; branchName; school; avgScore; numReviews; gender; ethnicity; travelReimbursementType; status\n";

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

gradingRouter.route("/grading-status").get(
  checkAbility("aggregate", "Review"),
  asyncHandler(async (req, res) => {
    const hexathon = req.query.hexathon as string;
    if (!hexathon) {
      throw new BadRequestError("Hexathon field is required in query parameters");
    }

    const gradingStatusData: any[] = await ApplicationModel.aggregate([
      {
        // Matches the hexathon and that it is a completed application
        $match: {
          hexathon: new Types.ObjectId(hexathon),
          status: {
            $ne: StatusType.DRAFT,
          },
        },
      },
      {
        // Joins the applications to the list of reviews
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "applicationId",
          as: "reviewsData",
        },
      },
      {
        // Joins the applications to the application branch
        $lookup: {
          from: "branches",
          localField: "applicationBranch",
          foreignField: "_id",
          as: "applicationBranchDetail",
        },
      },
      {
        // Un-nests the application branch data so that it is not an array
        $unwind: {
          path: "$applicationBranchDetail",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        // Ensures that the branch grading group value exists
        $match: {
          "applicationBranchDetail.grading.group": {
            $exists: true,
          },
        },
      },
      {
        // From here, separate into two steps, one to get total number of reviews
        // and another to get the total number of applications
        $facet: {
          reviewsData: [
            {
              // Un-nests the reviews data into each separate object
              $unwind: {
                path: "$reviewsData",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              // Groups the greview data by grading group and sums the total
              $group: {
                _id: "$applicationBranchDetail.grading.group",
                reviewCount: {
                  $sum: 1,
                },
              },
            },
          ],
          totalApplicationData: [
            {
              // Groups the application data by grading group and sums the total
              $group: {
                _id: "$applicationBranchDetail.grading.group",
                applicationCount: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
    ]);

    // Use lodash keyBy to convert the array of objects to an object by _id key
    const reviewsData = _.keyBy(gradingStatusData[0].reviewsData, "_id");
    const totalApplicationData = _.keyBy(gradingStatusData[0].totalApplicationData, "_id");

    // Map each grading group to a percentage of applications graded
    const gradingStatus: {
      [status in GradingGroupType]?: number;
    } = {};

    for (const gradingGroup of Object.values(GradingGroupType)) {
      // Divide all reviews data by max number of reviews per essay * 3 essays per application
      gradingStatus[gradingGroup] = Math.round(
        Math.min(
          1,
          (reviewsData[gradingGroup]?.reviewCount ?? 0) /
            (3 * MAX_REVIEWS_PER_ESSAY) /
            (totalApplicationData[gradingGroup]?.applicationCount ?? 1)
        ) * 100
      );
    }

    res.status(200).send(gradingStatus);
  })
);
