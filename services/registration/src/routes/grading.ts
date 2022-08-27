/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";

import { getUserInitialGradingGroup } from "../common/util";
import { getScoreMapping } from "../common/mapScores";
import { ApplicationModel, Essay, StatusType } from "../models/application";
import { GraderModel } from "../models/grader";
import { Review, ReviewModel } from "../models/review";
import { BranchModel } from "../models/branch";
import { gradingGroupMapping, calibrationQuestionMapping, rubricMapping } from "../config";

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

    let grader = await GraderModel.accessibleBy(req.ability).findOne({
      userId: req.user.uid,
      hexathon: req.body.hexathon,
    });

    // First-time grader -> so get initial grading group & give calibration questions
    if (!grader) {
      const gradingGroup = getUserInitialGradingGroup(req.user.email, gradingGroupMapping);
      grader = await GraderModel.create({
        userId: req.user.uid,
        hexathon: req.body.hexathon,
        email: req.user.email,
        calibrationScores: [],
        currentGradingGroup: gradingGroup,
        calibrationMapping: null,
      });
    }

    let { currentGradingGroup } = grader;
    if (!currentGradingGroup) {
      throw new BadRequestError("User is not in a grading group");
    }

    if (!calibrationQuestionMapping[currentGradingGroup]) {
      throw new BadRequestError(
        "Config is not in correct format. Grader's group name does not exist"
      );
    }

    const numCalibrationQuestionsForGroup = grader.calibrationScores.filter(
      score => score.group === currentGradingGroup
    ).length;

    let isCalibrationQuestion = false;
    let calibrationQuestion: any | undefined;
    let applicationQuestion: AggregatedEssay | undefined;
    if (numCalibrationQuestionsForGroup < calibrationQuestionMapping[currentGradingGroup].length) {
      isCalibrationQuestion = true;
      calibrationQuestion =
        calibrationQuestionMapping[currentGradingGroup][numCalibrationQuestionsForGroup];
    } else {
      const { branches } = gradingGroupMapping[currentGradingGroup];
      if (!branches || !Array.isArray(branches)) {
        throw new BadRequestError(
          "Please check config. Grading group branch mapping is incorrect."
        );
      }
      const databaseBranches = await BranchModel.find({
        name: { $in: branches },
        hexathon: req.body.hexathon,
      });

      let validEssays: AggregatedEssay[] = await ApplicationModel.aggregate([
        {
          $match: {
            status: StatusType.APPLIED,
            gradingComplete: false,
            applicationBranch: {
              $in: databaseBranches.map(branch => branch.id),
            },
            hexathon: req.body.hexathon,
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
            from: "review",
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

      // If there are no valid essays left for this group, try and get a new group
      if (validEssays.length === 0) {
        const allGroups = Object.keys(gradingGroupMapping);
        const potentialNewGroups = allGroups.filter(
          group => !grader?.completedGradingGroups.includes(group) && group !== currentGradingGroup
        );

        if (potentialNewGroups.length === 0) {
          validEssays = [];
        } else {
          grader.completedGradingGroups.push(currentGradingGroup);
          currentGradingGroup =
            potentialNewGroups[Math.floor(Math.random() * potentialNewGroups.length)];
          grader.currentGradingGroup = currentGradingGroup;
          isCalibrationQuestion = true;
          calibrationQuestion = calibrationQuestionMapping[currentGradingGroup][0]; // eslint-disable-line prefer-destructuring

          await grader.save();
        }
      }

      // Set the response to a random essay from the valid essays retrieved
      if (!isCalibrationQuestion) {
        applicationQuestion = validEssays[Math.floor(Math.random() * validEssays.length)];
      }
    }

    let branch;
    let criteria;
    // Set branch and criteria based on if calibration question or not
    if (isCalibrationQuestion) {
      branch = calibrationQuestion.branch;
      criteria = calibrationQuestion.criteria;
    } else {
      branch = applicationQuestion?.applicationBranch;
      criteria = applicationQuestion?.essay.criteria;
    }

    // Retrive rubric link and grading rubric from the rubric mapping config
    const { question, rubricLink, gradingRubric } = rubricMapping[branch][criteria];

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
        essayId: applicationQuestion?.essay.id,
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

    const { currentGradingGroup } = grader;
    if (!currentGradingGroup) {
      throw new BadRequestError("Please refresh the page. Grader's group is not found");
    } else if (!calibrationQuestionMapping[currentGradingGroup]) {
      throw new BadRequestError("Group Config is incorrectly formatted. Group name is incorrect");
    }

    if (!req.body.score || !req.body.essayId) {
      throw new BadRequestError("One or more of the method body arguments is missing.");
    }

    const numCalibrationScoresForGroup = grader.calibrationScores.filter(
      val => val.group === currentGradingGroup
    ).length;

    // Checks to make sure the user has completed all the calibration questions and that this request
    // is for a calibration question
    if (
      numCalibrationScoresForGroup < calibrationQuestionMapping[currentGradingGroup].length &&
      (!req.body.isCalibrationQuestion || req.body.applicationId)
    ) {
      throw new BadRequestError(
        "Cannot submit a score for this group yet. Calibration questions are not complete."
      );
    }

    if (numCalibrationScoresForGroup < calibrationQuestionMapping[currentGradingGroup].length) {
      grader.calibrationScores.push({
        group: currentGradingGroup,
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
        essayId: req.body.essayId,
        score: req.body.score,
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

gradingRouter.route("/leaderboard").get(
  checkAbility("read", "Grader"),
  asyncHandler(async (req, res) => {
    // Get top 10 graders in descending order (top grader first)
    const topGraders = await GraderModel.find({ hexathon: req.query.hexathon })
      .sort({ graded: -1 })
      .limit(10);

    // If there are no graders, send empty response
    if (topGraders.length === 0) {
      res.status(200).send({ leaderboard: [] });
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

    return res.status(200).send({ leaderboard });
  })
);
