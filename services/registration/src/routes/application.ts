import { asyncHandler } from "@api/common";
import express from "express";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { ApplicationModel } from "../models/application";

export const applicationRouter = express.Router();

const ajv = new Ajv();
addFormats(ajv);

const branchSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    type: { type: "string" },
    settings: {
      type: "object",
      properties: {
        open: { type: "string", format: "date-time" },
        close: { type: "string", format: "date-time" },
      },
      required: ["open", "close"],
    },
    jsonSchema: { type: "object", default: {} },
    uiSchema: { type: "object", default: {} },
  },
  required: ["name", "type", "settings", "jsonSchema", "uiSchema"],
};

const validateApplicationData = (applicationData: any) => {
  const validate = ajv.compile(branchSchema);
  const valid = validate(applicationData);
  if (!valid) {
    console.log(validate.errors);
  }
  return valid;
};

applicationRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const applications = await ApplicationModel.find({});

    return res.send(applications);
  })
);

applicationRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.find({ _id: req.query.id });

    return res.send(application);
  })
);

applicationRouter.route("/").post(
  asyncHandler(async (req, res) => {
    if (!validateApplicationData(req.body.applicationData)) {
      return res.status(400).send("Failure validating application data");
    }
    const newApplication = await ApplicationModel.create({
      user: req.body.user,
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
    if (!validateApplicationData(req.body.applicationData)) {
      return res.status(400).send("Failure validating application data");
    }
    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        user: req.body.user,
        hexathon: req.body.hexathon,
        applicationBranch: req.body.applicationBranch,
        applicationData: req.body.applicationData,
        applicationStartTime: req.body.appplicationStartTime,
        applicationSubmitTime: req.body.appplicationSubmitTime,
        confirmationBranch: req.body.confirmationBranch,
        confirmationData: req.body.confirmationData,
        confirmationStartTime: req.body.appplicationStartTime,
        confirmationSubmitTime: req.body.appplicationSubmitTime,
      },
      { new: true }
    );

    return res.send(updatedApplication);
  })
);
