/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, getFullName } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery, Types } from "mongoose";

import { validateApplicationData } from "../util";
import { Application, ApplicationModel, Essay, StatusType } from "../models/application";
import { BranchModel } from "src/models/branch";

export const applicationRouter = express.Router();

applicationRouter.route("/").get(
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
        { userId: { $regex: new RegExp(search) } },
        { email: { $regex: new RegExp(search) } },
        { name: { $regex: new RegExp(search) } },
      ];
    }

    const matchCount = await ApplicationModel.find(filter).count();

    const limit = parseInt(req.query.limit as string) || 200;
    const offset = parseInt(req.query.offset as string) || 0;
    const applications = await ApplicationModel.find(filter).skip(offset).limit(limit);

    return res.status(200).json({
      offset,
      total: matchCount,
      count: applications.length,
      applications,
    });
  })
);

applicationRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.findById(req.params.id);

    if (!application) {
      throw new BadRequestError("Application not found");
    }

    return res.send(application);
  })
);

applicationRouter.route("/actions/choose-application-branch").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    });

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

    // Need to do extra formatting for essays since they are subdocuments in Mongoose
    let { essays } = existingApplication.applicationData;
    if (req.body.applicationData.essays) {
      essays = new Types.DocumentArray<Essay>([]);
      for (const [name, answer] of Object.entries<any>(req.body.applicationData.essays)) {
        essays.push({
          name,
          answer,
        });
      }
    }

    const application: Partial<Application> = {
      applicationData: {
        ...existingApplication.applicationData,
        ...req.body.applicationData,
        essays,
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
