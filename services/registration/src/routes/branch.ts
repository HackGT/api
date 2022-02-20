import { asyncHandler } from "@api/common";
import express from "express";

import { BranchModel } from "../models/branch";

export const branchRouter = express.Router();

branchRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const branches = await BranchModel.find();
    res.send(branches);
  })
);

branchRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const new_branch = new BranchModel({
      name: req.body.name,
      type: req.body.type,
      settings: req.body.settings,
    });
    await new_branch.save();
    res.send(new_branch);
  })
);

branchRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const new_branch = await BranchModel.findOne({ id: req.params.id });
    res.send(new_branch);
  })
);

branchRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    try {
      const new_branch = await BranchModel.findOne({ id: req.params.id });
      if (req.body.name) {
        new_branch!.name = req.body.name;
      }
      if (req.body.type) {
        new_branch!.type = req.body.type;
      }
      if (req.body.settings) {
        new_branch!.settings = req.body.settings;
      }
      await new_branch!.save();
      res.send(new_branch);
    } catch {
      res.status(400);
      res.send({ error: "Branch doesn't exist!" });
    }
  })
);
