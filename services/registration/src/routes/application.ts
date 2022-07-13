/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import fs from "fs";
import path from "path";
import { FilterQuery } from "mongoose";

import { getGroup, getInitialGroupsLeft, validateApplicationData } from "../util";
import { getScoreMapping } from "../mapScores";
import { Application, ApplicationModel, StatusType } from "../models/application";
import { GraderModel } from "../models/grader";
import { CriteriaModel } from "../models/criteria";

export const applicationRouter = express.Router();

/*
  The purpose of this route is to get a grader's response to a specific question.
  Takes in email of someone who is grading the application (req.grader) 
  -> Checks if needs to do calibration questions (first-time graders have to do these) (keep returning these until all are answered)
  -> checks groups -> return questions to grade
*/
applicationRouter.route("/question").get(
  asyncHandler(async (req, res) => {
    const criteriaRubric = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../config/rubricmapping.json"), "utf8")
    );
    const groupmapping = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../config/groupmapping.json"), "utf8")
    );
    const questions = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../config/calibrationmapping.json"), "utf8")
    );

    // let allGroups = Object.keys(groupmapping); // generalGroup and emergingGroup

    const { user } = req;
    if (!user) {
      throw new BadRequestError("User is null");
    }

    const graderId = user.uid;
    const usersReq = apiCall(
      Service.USERS,
      {
        url: `/users/${graderId}`,
        method: "GET",
      },
      req
    );

    const emailId = await usersReq.then(response => response.email);

    let grader = await GraderModel.findOne({ userId: graderId });
    if (!grader) {
      // First-time grader -> so give calibration questions
      grader = await GraderModel.create({
        userId: graderId,
        email: emailId,
        graded: 0,
        skipped: 0,
        calibrationScores: null,
        group: null,
        groupsLeft: null,
        calibrationMapping: null,
      });
    }

    let calibrationQuestion = false;
    if (!grader.calibrationScores) {
      grader.calibrationScores = [];
    }

    let { group } = grader;
    if (!group) {
      grader.group = getGroup(grader.email);
      group = grader.group;
      grader.groupsLeft = getInitialGroupsLeft(group);
      await grader.save();
    }

    if (!questions[group]) {
      throw new BadRequestError(
        "Config is not in correct format. Grader's group name is incorrect"
      );
    }

    const lengthbygroup = grader.calibrationScores.filter(val => val.group === group).length;

    let response;
    if (lengthbygroup < questions[group].length) {
      calibrationQuestion = true;
      response = questions[group][lengthbygroup];
    } else {
      let responses: string | any[];
      const { tracks } = groupmapping[group];
      if (!tracks) {
        throw new BadRequestError("Group name is incorrect. getGroup returned an invalid answer");
      }

      responses = await CriteriaModel.find({
        "review.reviewerId": { $ne: graderId },
        "$or": [
          { review: { $exists: false } },
          { review: { $size: 0 } },
          { review: { $size: 1 } },
          // {review: {$size: 2}},
        ],
        "track": { $in: tracks },
        "done": false,
      });

      if (responses.length === 0) {
        const newGroup = grader.groupsLeft.pop();
        if (!newGroup) {
          responses = [];
        } else {
          group = newGroup;
          calibrationQuestion = true;
          response = questions[group][lengthbygroup];
          grader.group = group;
          await grader.save();
        }
      }

      if (!calibrationQuestion) {
        response = responses[Math.floor(Math.random() * responses.length)];
      }
    }

    let rubric;
    let rubricLink;
    for (let i = 0; i < criteriaRubric.length; i++) {
      if (
        criteriaRubric[i].name === response?.name &&
        criteriaRubric[i].track === response?.track
      ) {
        rubric = criteriaRubric[i].calibrationRubric;
        rubricLink = criteriaRubric[i].rubricLink;
      }
    }

    let result;
    if (calibrationQuestion) {
      result = {
        name: response.name,
        track: response.track,
        data: response.data,
        id: response._id,
        date: response.date,
        rubric,
        calibrationQuestion,
        rubricLink,
      };
    } else {
      result = {
        applicationID: response.applicationID,
        name: response.name,
        track: response.track,
        data: response.data,
        id: response._id,
        date: response.date,
        rubric,
        calibrationQuestion,
        rubricLink,
      };
    }
    return res.status(301).send(result);
  })
);

// /graded takes care of submitting the review
applicationRouter.route("/graded").post(
  asyncHandler(async (req, res) => {
    const { user } = req;
    if (!user) {
      throw new BadRequestError("User is null");
    }

    const grader = await GraderModel.findOne({ userId: user.uid });
    if (!grader) {
      throw new BadRequestError("Grader does not exist in database");
    }

    const questions = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../config/calibrationmapping.json"), "utf8")
    );

    const { score } = req.body;
    const { criteriaId } = req.body;

    if (score && criteriaId) {
      const { group } = grader;
      if (!group) {
        throw new BadRequestError("Please refresh the page. Grader's group is not found");
      } else if (!questions[group]) {
        throw new BadRequestError("Group Config is incorrectly formatted. Group name is incorrect");
      }

      const lengthbygroup = grader.calibrationScores.filter(val => val.group === group).length;

      if (lengthbygroup < questions[group].length) {
        grader.calibrationScores.push({
          group,
          score: req.body.score,
        });

        if (lengthbygroup === questions[group].length - 1) {
          const mappedScore = await getScoreMapping(grader.calibrationScores);
          grader.calibrationMapping = mappedScore;
        }
      } else {
        const criteria = await CriteriaModel.findOne({ applicationId: criteriaId });
        if (criteria) {
          let mapping: { [key: string]: number } = {};
          for (const c of grader.calibrationMapping) {
            if (criteria.name === c.criteria) {
              mapping = c.scoreMappings;
            }
          }

          let adjscore = -1;
          if (mapping) {
            adjscore = mapping[score];
            if (!adjscore) {
              adjscore = -1;
            }
          }

          criteria.review.push({
            by: {
              userId: user.uid,
              time: new Date(),
            },
            score: req.body.score,
            adjustedScore: adjscore,
          });

          if (user.graded) {
            user.graded += 1;
          } else {
            user.graded = 1;
          }

          if (criteria.review.length >= 3) {
            criteria.done = true;
            let sum = 0;
            for (let i = 0; i < criteria.review.length; i++) {
              sum += criteria.review[i].adjustedScore;
            }
            criteria.finalscore = sum / criteria.review.length;
          }
          await criteria.save();
        }
      }
      await grader.save();
      return res.status(200).send("Success");
    }
    return res.status(400).send("One or more of the method body arguments is missing");
  })
);

applicationRouter.route("/skip").get(
  asyncHandler(async (req, res) => {
    const { user } = req;
    if (!user) {
      throw new BadRequestError("User is null");
    }

    const grader = await GraderModel.findOne({ userId: user.uid });
    if (!grader) {
      throw new BadRequestError("Grader does not exist in database");
    }

    if (!grader.skipped) {
      grader.skipped = 0;
    }
    grader.skipped += 1;
    await grader.save();

    return res.status(200).send("Success");
  })
);

applicationRouter.route("/leaderboard").get(
  asyncHandler(async (req, res) => {
    const names: string[] = [];
    const numGraded: number[] = [];

    // Get top 10 graders in descending order (top grader first)
    const topGraders = await GraderModel.find({}).sort({ graded: -1 }).limit(10);
    if (!topGraders) {
      throw new BadRequestError("Database of graders is empty");
    }

    const promiseArr = [];

    for (let i = 0; i < topGraders.length; i++) {
      // Get name of user with apiCall()
      const usersReq = apiCall(
        Service.USERS,
        {
          url: `/users/${topGraders[i].userId}`,
          method: "GET",
        },
        req
      );

      promiseArr.push(usersReq);
    }

    const userNames = await Promise.all(promiseArr);
    for (let i = 0; i < userNames.length; i++) {
      if (userNames[i]) {
        userNames[i] = `${userNames[i].first} ${userNames[i].last}`;
        names.push(userNames[i]);

        if (topGraders[i] && topGraders[i].graded) {
          numGraded.push(topGraders[i].graded);
        } else {
          numGraded.push(0);
        }
      } else {
        return res.send({ error: "One or more of the users is invalid." });
      }
    }

    return res.status(200).send({ topGraders: names, numGraded });
  })
);

applicationRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Application> = {};

    if (req.query.hexathon) {
      filter.hexathon = req.query.hexathon;
    }

    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    const applications = await ApplicationModel.find(filter);
    const userIds = applications.map(application => application.userId).filter(Boolean); // Filters falsy values

    const userInfos = await apiCall(
      Service.USERS,
      { method: "POST", url: `/users/actions/retrieve`, data: { userIds } },
      req
    );

    const combinedApplications = [];

    for (const application of applications) {
      const matchedUserInfo = userInfos.find(
        (userInfo: any) => userInfo.userId === application.userId
      );

      combinedApplications.push({
        ...application.toObject(),
        userInfo: matchedUserInfo || {},
      });
    }

    return res.send(combinedApplications);
  })
);

applicationRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.findById(req.params.id);

    if (!application) {
      throw new BadRequestError("Application not found");
    }

    const userInfo = await apiCall(
      Service.USERS,
      { method: "GET", url: `users/${application.userId}` },
      req
    );

    const combinedApplication = {
      ...application.toObject(),
      userInfo: userInfo || {},
    };

    return res.send(combinedApplication);
  })
);

applicationRouter.route("/actions/choose-application-branch").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    });

    if (existingApplication) {
      if (existingApplication.status !== StatusType.DRAFT) {
        throw new BadRequestError(
          "Cannot select an application branch. You have already submitted an application."
        );
      }

      existingApplication.applicationBranch = req.body.applicationBranch;
      existingApplication.applicationStartTime = new Date();
      existingApplication.applicationData = {};

      await existingApplication.save();

      return res.send(existingApplication);
    }

    const newApplication = await ApplicationModel.create({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
      applicationBranch: req.body.applicationBranch,
      applicationStartTime: new Date(),
    });

    return res.send(newApplication);
  })
);

applicationRouter.route("/:id/actions/save-application-data").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id);

    if (!existingApplication) {
      throw new BadRequestError("No application exists with this id");
    }

    if (existingApplication.status !== StatusType.DRAFT) {
      throw new BadRequestError(
        "Cannot save application data. You have already submitted an application."
      );
    }

    await validateApplicationData(
      req.body.applicationData,
      existingApplication.applicationBranch._id,
      req.body.branchFormPage,
      false
    );

    const application: Partial<Application> = {
      applicationData: {
        ...existingApplication.applicationData,
        ...req.body.applicationData,
      },
    };

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      application,
      { new: true }
    );

    return res.send(updatedApplication);
  })
);

applicationRouter.route("/:id/actions/submit-application").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id);

    if (!existingApplication) {
      throw new BadRequestError("No application exists with this id");
    }

    if (existingApplication.status !== StatusType.DRAFT) {
      throw new BadRequestError(
        "Cannot submit an application. You have already submitted an application."
      );
    }
    await Promise.all(
      existingApplication.applicationBranch.formPages.map(async (formPage, index) => {
        await validateApplicationData(
          existingApplication.applicationData,
          existingApplication.applicationBranch._id,
          index,
          true
        );
      })
    );

    const application: Partial<Application> = {
      applicationSubmitTime: new Date(),
      status: StatusType.APPLIED,
    };

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      application,
      { new: true }
    );

    return res.send(updatedApplication);
  })
);

applicationRouter.route("/:id/actions/save-confirmation-data").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id);

    if (!existingApplication) {
      throw new BadRequestError("No application exists with this id");
    }

    if (!existingApplication.confirmationBranch) {
      throw new BadRequestError("No confirmation branch is selected.");
    }

    if (existingApplication.status === StatusType.CONFIRMED) {
      throw new BadRequestError(
        "Cannot save confirmation data. You have already submitted your confirmation."
      );
    }
    if (existingApplication.status !== StatusType.ACCEPTED) {
      throw new BadRequestError(
        "Cannot save confirmation data. Your application has not been accepted."
      );
    }

    await validateApplicationData(
      req.body.confirmationData,
      existingApplication.confirmationBranch._id,
      req.body.branchFormPage,
      false
    );

    const application: Partial<Application> = {
      confirmationData: {
        ...existingApplication.confirmationData,
        ...req.body.confirmationData,
      },
    };

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      application,
      { new: true }
    );

    return res.send(updatedApplication);
  })
);

applicationRouter.route("/:id/actions/submit-confirmation").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id);

    if (!existingApplication) {
      throw new BadRequestError("No application exists with this id");
    }

    if (!existingApplication.confirmationBranch) {
      throw new BadRequestError("No confirmation branch is selected.");
    }

    if (existingApplication.status === StatusType.CONFIRMED) {
      throw new BadRequestError(
        "Cannot submit a confirmation. You have already submitted a confirmation."
      );
    }
    if (existingApplication.status !== StatusType.ACCEPTED) {
      throw new BadRequestError(
        "Cannot submit a confirmation. Your application has not been accepted."
      );
    }

    await Promise.all(
      existingApplication.confirmationBranch.formPages.map(async (formPage, index) => {
        await validateApplicationData(
          existingApplication.confirmationData,
          existingApplication.confirmationBranch?._id,
          index,
          true
        );
      })
    );

    const application: Partial<Application> = {
      confirmationSubmitTime: new Date(),
      status: StatusType.CONFIRMED,
    };

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      application,
      { new: true }
    );

    return res.send(updatedApplication);
  })
);
