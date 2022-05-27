import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";

import { Application, ApplicationModel } from "../models/application";
import { validateApplicationData } from "../util";

export const applicationRouter = express.Router();

applicationRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const applications = await ApplicationModel.find({});

    return res.send(applications);
  })
);

applicationRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.findById(req.params.id);

    return res.send(application);
  })
);

applicationRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    });

    if (existingApplication) {
      throw new BadRequestError("User already has an existing application for this event");
    }

    await validateApplicationData(req.body.applicationBranch, req.body.applicationData);

    const application: Partial<Application> = {
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
      applicationBranch: req.body.applicationBranch,
      applicationData: req.body.applicationData,
      applicationStartTime: new Date(),
    };

    if (req.body.applicationStatus === "SUBMIT") {
      application.applicationSubmitTime = new Date();
    }

    const newApplication = await ApplicationModel.create(application);

    return res.send(newApplication);
  })
);

applicationRouter.route("/:id").patch(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id);

    if (!existingApplication) {
      throw new BadRequestError("No application exists with this id");
    }

    await validateApplicationData(
      existingApplication.applicationBranch._id, // eslint-disable-line no-underscore-dangle
      req.body.applicationData
    );

    const application: Partial<Application> = {
      applicationData: req.body.applicationData,
    };

    if (req.body.applicationStatus === "SUBMIT") {
      application.applicationSubmitTime = new Date();
    }

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      application,
      { new: true }
    );

    return res.send(updatedApplication);
  })
);

applicationRouter.route("/:id/confirmation").post(
  asyncHandler(async (req, res) => {
    await validateApplicationData(req.body.applicationBranch, req.body.applicationData);

    const confirmation: Partial<Application> = {
      confirmationBranch: req.body.confirmationBranch,
      confirmationData: req.body.confirmationData,
      confirmationStartTime: new Date(),
    };

    if (req.body.confirmationStatus === "SUBMIT") {
      confirmation.confirmationSubmitTime = new Date();
    }

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      confirmation,
      { new: true }
    );

    return res.send(updatedApplication);
  })
);
