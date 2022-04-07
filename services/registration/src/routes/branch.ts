import { asyncHandler } from "@api/common";
import express from "express";

import { BranchModel } from "../models/branch";

export const branchRouter = express.Router();

branchRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const branches = await BranchModel.find({});

    return res.send(branches);
  })
);

branchRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const newBranch = await BranchModel.create({
      name: req.body.name,
      type: req.body.type,
      settings: req.body.settings,
      jsonSchema: req.body.jsonSchema,
      uiSchema: req.body.uiSchema,
    });

    return res.send(newBranch);
  })
);

branchRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const newBranch = await BranchModel.findById(req.query.id);

    return res.send(newBranch);
  })
);

branchRouter.route("/:id").patch(
  asyncHandler(async (req, res) => {
    const updatedBranch = await BranchModel.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        type: req.body.type,
        settings: req.body.settings,
        jsonSchema: req.body.jsonSchema,
        uiSchema: req.body.uiSchema,
      },
      { new: true }
    );

    return res.send(updatedBranch);
  })
);
