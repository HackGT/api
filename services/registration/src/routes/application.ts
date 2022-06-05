/* eslint-disable no-underscore-dangle */
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

applicationRouter.route("/actions/choose-application-branch").post(
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    });

    if (existingApplication) {
      if (existingApplication.applied) {
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

    if (existingApplication.applied) {
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

    if (existingApplication.applied) {
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
      applied: true,
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

    if (existingApplication.confirmed) {
      throw new BadRequestError(
        "Cannot save confirmation data. You have already submitted your confirmation."
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

    if (existingApplication.confirmed) {
      throw new BadRequestError(
        "Cannot submit a confirmation. You have already submitted a confirmation."
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
      confirmed: true,
    };

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      application,
      { new: true }
    );

    return res.send(updatedApplication);
  })
);
