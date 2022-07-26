/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery, Types } from "mongoose";

import { validateApplicationData } from "../util";
import { Application, ApplicationModel, Essay, StatusType } from "../models/application";

export const applicationRouter = express.Router();

applicationRouter.route("/").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Application> = {};

    if (req.query.hexathon) {
      filter.hexathon = req.query.hexathon;
    }

    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    // Find application and remove data fields for ease
    const applications = await ApplicationModel.accessibleBy(req.ability)
      .find(filter)
      .select("-applicationData -confirmationData");
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
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.findById(req.params.id).accessibleBy(req.ability);

    if (!application) {
      throw new BadRequestError("Application not found or you do not have permission to access.");
    }

    const userInfo = await apiCall(
      Service.USERS,
      { method: "GET", url: `users/${application.userId}` },
      req
    );

    const applicationData = { ...application.applicationData };
    if (applicationData.resume) {
      applicationData.resume = await apiCall(
        Service.FILES,
        { method: "GET", url: `files/${applicationData.resume}` },
        req
      );
    }

    const combinedApplication = {
      ...application.toObject(),
      applicationData,
      userInfo: userInfo || {},
    };

    return res.send(combinedApplication);
  })
);

applicationRouter.route("/actions/choose-application-branch").post(
  checkAbility("create", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    }).accessibleBy(req.ability);

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
      for (const [criteria, answer] of Object.entries<any>(req.body.applicationData.essays)) {
        essays.push({
          criteria,
          answer,
        });
      }
    }

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        applicationData: {
          ...existingApplication.applicationData,
          ...req.body.applicationData,
          essays,
        },
      },
      { new: true }
    ).select("userId hexathon applicationBranch applicationData");

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
      ...updatedApplication.toObject(),
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

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    if (existingApplication.status !== StatusType.DRAFT) {
      throw new BadRequestError(
        "Cannot submit an application. You have already submitted an application."
      );
    }

    // Need to do extra formatting for essays since they are subdocuments in Mongoose
    const essays: any = {};
    for (const essay of existingApplication.applicationData.essays ?? []) {
      essays[essay.criteria] = essay.answer;
    }

    const applicationData = {
      ...existingApplication.applicationData,
      essays,
    };

    await Promise.all(
      existingApplication.applicationBranch.formPages.map(async (formPage, index) => {
        await validateApplicationData(
          applicationData,
          existingApplication.applicationBranch._id,
          index,
          true
        );
      })
    );

    await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        applicationSubmitTime: new Date(),
        status: StatusType.APPLIED,
      },
      { new: true }
    );

    return res.status(204);
  })
);

applicationRouter.route("/:id/actions/save-confirmation-data").post(
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

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        confirmationData: {
          ...existingApplication.confirmationData,
          ...req.body.confirmationData,
        },
      },
      { new: true }
    ).select("userId hexathon confirmationBranch confirmationData");

    return res.send(updatedApplication);
  })
);

applicationRouter.route("/:id/actions/submit-confirmation").post(
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

    await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        confirmationSubmitTime: new Date(),
        status: StatusType.CONFIRMED,
      },
      { new: true }
    );

    return res.status(204);
  })
);
