/* eslint-disable no-underscore-dangle */
import express from "express";
import { FilterQuery } from "mongoose";
import { apiCall, asyncHandler, BadRequestError } from "@api/common";
import { Service } from "@api/config";

import { Application, ApplicationModel, StatusType } from "../models/application";
import { validateApplicationData } from "../util";

export const applicationRouter = express.Router();

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
      switch (existingApplication.status) {
        case StatusType.APPLIED: {
          throw new BadRequestError(
            "Cannot select an application branch. You have already submitted an application."
          );
        }
        case StatusType.ACCEPTED: {
          throw new BadRequestError(
            "Cannot select an application branch. Your application has already been accepted."
          );
        }
        case StatusType.CONFIRMED: {
          throw new BadRequestError(
            "Cannot select an application branch. Your application has already been confirmed."
          );
        }
        case StatusType.DENIED: {
          throw new BadRequestError(
            "Cannot select an application branch. Your application has already been denied."
          );
        }
        default: {
          existingApplication.applicationBranch = req.body.applicationBranch;
          existingApplication.applicationStartTime = new Date();
          existingApplication.applicationData = {};

          await existingApplication.save();

          return res.send(existingApplication);
        }
      }
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

    switch (existingApplication.status) {
      case StatusType.APPLIED: {
        throw new BadRequestError(
          "Cannot save application data. You have already submitted an application."
        );
      }
      case StatusType.ACCEPTED: {
        throw new BadRequestError(
          "Cannot save application data. Your application has already been accepted."
        );
      }
      case StatusType.CONFIRMED: {
        throw new BadRequestError(
          "Cannot save application data. Your application has already been confirmed."
        );
      }
      case StatusType.DENIED: {
        throw new BadRequestError(
          "Cannot save application data. Your application has already been denied."
        );
      }
      default: {
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
      }
    }
  })
);

applicationRouter.route("/:id/actions/submit-application").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id);

    if (!existingApplication) {
      throw new BadRequestError("No application exists with this id");
    }

    switch (existingApplication.status) {
      case StatusType.APPLIED: {
        throw new BadRequestError(
          "Cannot submit an application. You have already submitted an application."
        );
      }
      case StatusType.ACCEPTED: {
        throw new BadRequestError(
          "Cannot submit an application. Your application has already been accepted."
        );
      }
      case StatusType.CONFIRMED: {
        throw new BadRequestError(
          "Cannot submit an application. Your application has already been confirmed."
        );
      }
      case StatusType.DENIED: {
        throw new BadRequestError(
          "Cannot submit an application. Your application has already been denied."
        );
      }
      default: {
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
      }
    }
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
