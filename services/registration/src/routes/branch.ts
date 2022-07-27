import { asyncHandler, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { Branch, BranchModel } from "../models/branch";

export const branchRouter = express.Router();

branchRouter.route("/").get(
  checkAbility("read", "Branch"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Branch> = {};

    if (req.query.hexathon) {
      filter.hexathon = req.query.hexathon;
    }

    const branches = await BranchModel.find(filter).accessibleBy(req.ability);

    return res.send(branches);
  })
);

branchRouter.route("/:id").get(
  checkAbility("read", "Branch"),
  asyncHandler(async (req, res) => {
    const branch = await BranchModel.findById(req.params.id).accessibleBy(req.ability);

    return res.send(branch);
  })
);

branchRouter.route("/").post(
  checkAbility("update", "Branch"),
  asyncHandler(async (req, res) => {
    const newBranch = await BranchModel.create(req.body);

    return res.send(newBranch);
  })
);

branchRouter.route("/:id").patch(
  checkAbility("update", "Branch"),
  asyncHandler(async (req, res) => {
    const updatedBranch = await BranchModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    return res.send(updatedBranch);
  })
);

branchRouter.route("/:id").delete(
  checkAbility("delete", "Branch"),
  asyncHandler(async (req, res) => {
    await BranchModel.findByIdAndDelete(req.params.id);

    return res.sendStatus(204);
  })
);
