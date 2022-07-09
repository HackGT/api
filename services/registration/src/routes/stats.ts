/* eslint-disable no-underscore-dangle */
import { asyncHandler } from "@api/common";
import express from "express";

import { ApplicationModel } from "../models/application";
import { BranchModel, BranchType } from "../models/branch";

export const statisticsRouter = express.Router();

statisticsRouter.route("/users").get(
  asyncHandler(async (req, res) => {
    // from the status field, get applied, accepted, confirmed and non-confirmed users
    const aggregatedUsers = await ApplicationModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const draftUsers = aggregatedUsers.filter(application => application._id === "DRAFT")[0].count;
    const appliedUsers = aggregatedUsers.filter(application => application._id === "APPLIED")[0]
      .count;
    const acceptedUsers = aggregatedUsers.filter(application => application._id === "ACCEPTED")[0]
      .count;
    const confirmedUsers = aggregatedUsers.filter(application => application._id === "CONFIRMED")[0]
      .count;

    const userStatistics = {
      totalUsers: draftUsers + appliedUsers,
      appliedUsers,
      acceptedUsers,
      confirmedUsers,
      nonConfirmedUsers: acceptedUsers - confirmedUsers,
    };
  })
);
