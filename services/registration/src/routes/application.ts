import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import Ajv from "ajv";

import { ApplicationModel } from "../models/application";

export const applicationRouter = express.Router();

const ajv = new Ajv();

const jsonSchema = {
  type: "object",
  required: ["firstName", "lastName"],
  properties: {
    firstName: {
      type: "string",
      title: "First name",
    },
    lastName: {
      type: "string",
      title: "Last name",
    },
    telephone: {
      type: "string",
      title: "Telephone",
      minLength: 10,
    },
  },
};

const validateApplicationData = (applicationData: any) => {
  const validate = ajv.compile(jsonSchema);
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
    const application = await ApplicationModel.find({ _id: req.query.id });

    return res.send(application);
  })
);

applicationRouter.route("/").post(
  asyncHandler(async (req, res) => {
    validateApplicationData(req.body.applicationData);
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
    validateApplicationData(req.body.applicationData);
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
