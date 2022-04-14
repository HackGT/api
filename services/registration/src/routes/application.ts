import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import Ajv from "ajv";

import { ApplicationModel } from "../models/application";
import { BranchModel } from "../models/branch";

export const applicationRouter = express.Router();
const ajv = new Ajv();

const validateApplicationData = async (branchId: any, applicationData: any) => {
  const branch = await BranchModel.findById(branchId);
  if (branch == null) {
    throw new BadRequestError("Branch not found.");
  }

  const validate = ajv.compile(branch.jsonSchema);
  const valid = validate(applicationData);
  if (!valid) {
    throw new BadRequestError(`${validate.errors}`);
  }
};

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
    await validateApplicationData(req.body.applicationBranch, req.body.applicationData);

    const newApplication = await ApplicationModel.create({
      userId: req.body.userId,
      hexathon: req.body.hexathon,
      applicationBranch: req.body.applicationBranch,
      applicationData: req.body.applicationData,
      applicationStartTime: req.body.applicationStartTime,
      applicationSubmitTime: req.body.applicationSubmitTime,
      confirmationBranch: req.body.confirmationBranch,
      confirmationData: req.body.confirmationData,
      confirmationStartTime: req.body.confirmationStartTime,
      confirmationSubmitTime: req.body.confirmationSubmitTime,
    });

    return res.send(newApplication);
  })
);

applicationRouter.route("/:id").patch(
  asyncHandler(async (req, res) => {
    await validateApplicationData(req.body.applicationBranch, req.body.applicationData);

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        userId: req.body.userId,
        hexathon: req.body.hexathon,
        applicationBranch: req.body.applicationBranch,
        applicationData: req.body.applicationData,
        applicationStartTime: req.body.applicationStartTime,
        applicationSubmitTime: req.body.applicationSubmitTime,
        confirmationBranch: req.body.confirmationBranch,
        confirmationData: req.body.confirmationData,
        confirmationStartTime: req.body.applicationStartTime,
        confirmationSubmitTime: req.body.applicationSubmitTime,
      },
      { new: true }
    );
    return res.send(updatedApplication);
  })
);
