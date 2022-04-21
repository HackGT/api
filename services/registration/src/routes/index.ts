import { asyncHandler } from "@api/common";
import express from "express";

import { ApplicationModel } from "src/models/application";
import { BranchModel, BranchType } from "src/models/branch";
import { applicationRouter } from "./application";
import { branchRouter } from "./branch";

export const defaultRouter = express.Router();

defaultRouter.use("/branches", branchRouter);
defaultRouter.use("/applications", applicationRouter);

defaultRouter.route("/statistics").get(
  asyncHandler(async (req, res) => {
    const totalUsers = await ApplicationModel.countDocuments({});
    const submittedUsers = await ApplicationModel.countDocuments({
      applicationSubmitTime: { $exists: true, $ne: null },
    });
    const confirmedUsers = await ApplicationModel.countDocuments({
      confirmationBranch: { $exists: true, $ne: null },
    });
    let applications = {};
    await (
      await BranchModel.find({ type: BranchType.APPLICATION })
    ).forEach(async branch => {
      const branchName = branch.name;
      const count = await ApplicationModel.countDocuments({
        applicationBranch: branch,
      });
      applications = { ...applications, [branchName]: count };
    });

    let confirmations = {};
    await (
      await BranchModel.find({ type: BranchType.CONFIRMATION })
    ).forEach(async branch => {
      const branchName = branch.name;
      const count = await ApplicationModel.countDocuments({
        confirmationBranch: branch,
      });
      confirmations = { ...confirmations, [branchName]: count };
    });

    const statistics = {
      general: {
        applicationStarted: totalUsers - submittedUsers,
        applicationSubmitted: submittedUsers,
        confirmed: confirmedUsers,
      },
      applications,
      confirmations,
    };
    return res.send(statistics);
  })
);
