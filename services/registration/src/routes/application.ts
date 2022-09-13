/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, getFullName, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery, Types } from "mongoose";
import _ from "lodash";

import { getBranch, validateApplicationData } from "../common/util";
import { Application, ApplicationModel, Essay, StatusType } from "../models/application";
import { BranchModel, BranchType } from "../models/branch";

export const applicationRouter = express.Router();

applicationRouter.route("/").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Application> = {};
    filter.hexathon = req.query.hexathon;

    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    if (req.query.search) {
      const searchLength = (req.query.search as string).length;
      const search =
        searchLength > 75
          ? (req.query.search as string).slice(0, 75)
          : (req.query.search as string);
      filter.$or = [
        { userId: { $regex: new RegExp(search, "i") } },
        { email: { $regex: new RegExp(search, "i") } },
        { name: { $regex: new RegExp(search, "i") } },
      ];
    }

    const matchCount = await ApplicationModel.accessibleBy(req.ability).find(filter).count();

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const applications = await ApplicationModel.accessibleBy(req.ability)
      .find(filter)
      .skip(offset)
      .limit(limit)
      .select("-applicationData -decisionData");

    return res.status(200).json({
      offset,
      total: matchCount,
      count: applications.length,
      applications,
    });
  })
);

applicationRouter.route("/:id").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.findById(req.params.id).accessibleBy(req.ability);

    if (!application) {
      throw new BadRequestError("Application not found or you do not have permission to access.");
    }

    const applicationData = { ...application.applicationData };
    if (applicationData.resume) {
      applicationData.resume = await apiCall(
        Service.FILES,
        { method: "GET", url: `files/${applicationData.resume}` },
        req
      );
    }

    return res.send({
      ...application.toJSON(),
      applicationData,
    });
  })
);

applicationRouter.route("/actions/choose-application-branch").post(
  checkAbility("create", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    }).accessibleBy(req.ability);

    const userInfo = await apiCall(
      Service.USERS,
      { method: "GET", url: `users/${req.user?.uid}` },
      req
    );
    if (!userInfo || Object.keys(userInfo).length === 0) {
      throw new BadRequestError("Please complete your user profile first.");
    }

    const branch = await BranchModel.findById(req.body.applicationBranch);
    if (!branch || branch.hexathon.toString() !== req.body.hexathon) {
      throw new BadRequestError(
        "Invalid branch. Please select an application branch that is valid for this hexathon."
      );
    }

    if (existingApplication) {
      if (existingApplication.status !== StatusType.DRAFT) {
        throw new BadRequestError(
          "Cannot select an application branch. You have already submitted an application."
        );
      }

      existingApplication.applicationBranch = req.body.applicationBranch;
      existingApplication.applicationStartTime = new Date();
      existingApplication.applicationData = {};
      existingApplication.name = getFullName(userInfo.name);
      existingApplication.email = userInfo.email;

      await existingApplication.save();

      return res.send(existingApplication);
    }

    const newApplication = await ApplicationModel.create({
      userId: req.user?.uid,
      name: getFullName(userInfo.name),
      email: userInfo.email,
      hexathon: req.body.hexathon,
      applicationBranch: req.body.applicationBranch,
      applicationStartTime: new Date(),
    });

    return res.send(newApplication);
  })
);

applicationRouter.route("/:id/actions/save-application-data").post(
  checkAbility("update", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    const [branch] = getBranch(existingApplication, req);
    if (new Date() < branch.settings.open || new Date() > branch.settings.close) {
      throw new BadRequestError("Unable to save application data. Branch is not currently open.");
    }

    if (req.body.validateData === true) {
      await validateApplicationData(req.body.applicationData, branch._id, req.body.branchFormPage);
    }

    // Need to do extra formatting for essays since they are subdocuments in Mongoose
    let { essays } = existingApplication.applicationData;
    if (req.body.applicationData.essays) {
      essays = new Types.DocumentArray<Essay>([]);
      for (const [criteria, answer] of Object.entries<any>(req.body.applicationData.essays)) {
        essays.push({
          criteria,
          answer,
        });
      }
    }

    // Need to do extra formatting for resume since its submitted as a file object
    let { resume } = existingApplication.applicationData;
    if (req.body.applicationData.resume?.id) {
      resume = req.body.applicationData.resume.id;
    } else if (_.isEmpty(req.body.applicationData.resume)) {
      resume = undefined;
    }

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        applicationData: {
          ...existingApplication.applicationData,
          ...req.body.applicationData,
          essays,
          resume,
        },
      },
      { new: true }
    ).select("userId hexathon applicationBranch confirmationBranch applicationData");

    if (!updatedApplication) {
      throw new BadRequestError("Error saving application data.");
    }

    const applicationData = { ...updatedApplication.applicationData };
    if (applicationData.resume) {
      applicationData.resume = await apiCall(
        Service.FILES,
        { method: "GET", url: `files/${applicationData.resume}` },
        req
      );
    }

    return res.send({
      ...updatedApplication.toJSON(),
      applicationData,
    });
  })
);

applicationRouter.route("/:id/actions/submit-application").post(
  checkAbility("update", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    const [branch, branchType] = getBranch(existingApplication, req);
    if (new Date() < branch.settings.open || new Date() > branch.settings.close) {
      throw new BadRequestError("Unable to submit application data. Branch is not currently open.");
    }

    // Need to do extra formatting for essays since they are subdocuments in Mongoose
    const essays: any = {};
    for (const essay of existingApplication.applicationData.essays ?? []) {
      essays[essay.criteria] = essay.answer;
    }

    // Need to do extra formatting for resumes since they are string in Mongoose
    let resume: any;
    if (existingApplication.applicationData.resume) {
      resume = await apiCall(
        Service.FILES,
        { method: "GET", url: `files/${existingApplication.applicationData.resume}` },
        req
      );
    }

    const applicationData = {
      ...existingApplication.applicationData,
      essays,
      resume,
    };

    await Promise.all(
      branch.formPages.map(async (formPage, index) => {
        await validateApplicationData(applicationData, branch._id, index);
      })
    );

    switch (branchType) {
      case BranchType.APPLICATION:
        await ApplicationModel.findByIdAndUpdate(
          req.params.id,
          {
            applicationSubmitTime: new Date(),
            status: StatusType.APPLIED,
          },
          { new: true }
        );
        break;
      case BranchType.CONFIRMATION:
        await ApplicationModel.findByIdAndUpdate(
          req.params.id,
          {
            confirmationSubmitTime: new Date(),
            status: StatusType.CONFIRMED,
          },
          { new: true }
        );
        break;
      // no default
    }

    return res.sendStatus(204);
  })
);

applicationRouter.route("/:id/actions/update-status").post(
  checkAbility("update", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    const newStatus = StatusType[req.body.status as keyof typeof StatusType];

    // Non-member users are restricted to changing status in only very limited circumstances
    if (!req.user?.roles.member) {
      if (
        existingApplication.status === StatusType.ACCEPTED &&
        newStatus === StatusType.CONFIRMED &&
        (existingApplication.confirmationBranch === undefined ||
          existingApplication.confirmationBranch.formPages.length === 0)
      ) {
        // pass
      } else if (
        existingApplication.status === StatusType.ACCEPTED &&
        newStatus === StatusType.NOT_ATTENDING
      ) {
        // pass
      } else {
        throw new BadRequestError(
          "You do not have permission to change this application to the new status provided."
        );
      }
    }

    await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        status: newStatus,
      },
      { new: true }
    );

    return res.sendStatus(204);
  })
);

applicationRouter.route("/:id/actions/reset-application").post(
  checkAbility("manage", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        applicationSubmitTime: undefined,
        confirmationSubmitTime: undefined,
        status: StatusType.DRAFT,
      },
      { new: true }
    );

    return res.sendStatus(204);
  })
);
