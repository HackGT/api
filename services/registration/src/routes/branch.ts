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
    const newBranch = await BranchModel.create(req.body);

    return res.send(newBranch);
  })
);

branchRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const branch = await BranchModel.findById(req.params.id);

    return res.send(branch);
  })
);

branchRouter.route("/:id").patch(
  asyncHandler(async (req, res) => {
    const updatedBranch = await BranchModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    return res.send(updatedBranch);
  })
);
