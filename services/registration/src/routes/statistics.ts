/* eslint-disable no-underscore-dangle */
import { asyncHandler } from "@api/common";
import express from "express";

import { ApplicationModel, StatusType } from "../models/application";
import { BranchModel, BranchType } from "../models/branch";

export const statisticsRouter = express.Router();

statisticsRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const aggregatedUsers = await ApplicationModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const aggregatedApplicationBranches = await BranchModel.aggregate([
      {
        $match: { type: BranchType.APPLICATION },
      },
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
        },
      },
    ]);

    const aggregatedConfirmationBranches = await BranchModel.aggregate([
      {
        $match: { type: BranchType.CONFIRMATION },
      },
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
        },
      },
    ]);

    const aggregatedRejections = await BranchModel.aggregate([
      {
        $match: { status: StatusType.DENIED },
      },
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
        },
      },
    ]);

    let [draftUsers, appliedUsers, acceptedUsers, confirmedUsers, deniedUsers] = Array(5).fill(0);
    for (const element of aggregatedUsers) {
      switch (element._id) {
        case StatusType.DRAFT:
          draftUsers = element.count;
          break;
        case StatusType.APPLIED:
          appliedUsers = element.count;
          break;
        case StatusType.ACCEPTED:
          acceptedUsers = element.count;
          break;
        case StatusType.CONFIRMED:
          confirmedUsers = element.count;
          break;
        case StatusType.DENIED:
          deniedUsers = element.count;
          break;
        default:
        // do nothing
      }
    }
    const userStatistics = {
      totalUsers: draftUsers + appliedUsers,
      appliedUsers,
      acceptedUsers,
      confirmedUsers,
      nonConfirmedUsers: acceptedUsers - confirmedUsers,
      deniedUsers,
    };

    let applicationStatistics: Record<string, number> = {};
    let confirmationStatistics: Record<string, number> = {};
    let rejectionStatistics: Record<string, number> = {};

    for (const element of aggregatedApplicationBranches) {
      const branch: string = element._id;
      applicationStatistics = { ...applicationStatistics, [branch]: element.count };
    }

    for (const element of aggregatedConfirmationBranches) {
      const branch: string = element._id;
      confirmationStatistics = { ...confirmationStatistics, [branch]: element.count };
    }
    for (const element of aggregatedRejections) {
      const branch: string = element._id;
      rejectionStatistics = { ...rejectionStatistics, [branch]: element.count };
    }

    const statistics = {
      userStatistics,
      applicationStatistics,
      confirmationStatistics,
      rejectionStatistics,
    };

    return res.send(statistics);
  })
);
