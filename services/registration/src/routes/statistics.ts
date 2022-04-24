/* eslint-disable no-underscore-dangle */
import { asyncHandler } from "@api/common";
import express from "express";

import { ApplicationModel } from "src/models/application";
import { BranchModel, BranchType } from "src/models/branch";

export const statisticsRouter = express.Router();

statisticsRouter.route("/").get(
  asyncHandler(async (req, res) => {
    let totalUsers = 0;
    let confirmedUsers = 0;
    const submittedUsers = await ApplicationModel.countDocuments({
      applicationSubmitTime: { $exists: true, $ne: null },
    });
    let applications = {};
    let confirmations = {};

    const applicationBranchAggregator = [
      {
        $group: {
          _id: "$applicationBranch",
          count: { $sum: 1 },
        },
      },
    ];
    const confirmationBranchAggregator = [
      {
        $group: {
          _id: "$confirmationBranch",
          count: { $sum: 1 },
        },
      },
    ];

    const aggregatedApplicationBranches = await ApplicationModel.aggregate(
      applicationBranchAggregator
    );
    const aggregatedConfirmationBranches = await ApplicationModel.aggregate(
      confirmationBranchAggregator
    );

    const allBranches = await BranchModel.find({});
    allBranches.forEach(branch => {
      const branchName = branch.name;

      switch (branch.type) {
        case BranchType.APPLICATION:
          for (const application of aggregatedApplicationBranches) {
            totalUsers += application.count;
            if (application._id && application._id.equals(branch._id)) {
              applications = { ...applications, [branchName]: application.count };
            }
          }
          break;
        case BranchType.CONFIRMATION:
          for (const confirmation of aggregatedConfirmationBranches) {
            confirmedUsers += confirmation.count;
            if (confirmation._id && confirmation._id.equals(branch._id)) {
              confirmations = { ...confirmations, [branchName]: confirmation.count };
            }
          }
          break;
        default:
          console.log(`Branch ${branchName} is not of type application or confirmation.`);
          break;
      }

      if (branch.type === BranchType.APPLICATION) {
        for (const application of aggregatedApplicationBranches) {
          totalUsers += application.count;
          if (application._id && application._id.equals(branch._id)) {
            applications = { ...applications, [branchName]: application.count };
          }
        }
      }
      if (branch.type === BranchType.CONFIRMATION) {
        for (const confirmation of aggregatedConfirmationBranches) {
          confirmedUsers += confirmation.count;
          if (confirmation._id && confirmation._id.equals(branch._id)) {
            confirmations = { ...confirmations, [branchName]: confirmation.count };
          }
        }
      }
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
