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
    const new_branch = await BranchModel.create({
      name: req.body.name,
      type: req.body.type,
      settings: req.body.settings,
    });
    return res.send(new_branch);
  })
);

branchRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const new_branch = await BranchModel.findById({ _id: req.query.id });
    return res.send(new_branch);
  })
);

branchRouter.route("/:id").patch(
  asyncHandler(async (req, res) => {
    const updated_branch = await BranchModel.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        type: req.body.type,
        settings: req.body.settings,
      },
      { new: true }
    );
    return res.send(updated_branch);
  })
);
