/* eslint-disable no-underscore-dangle */
import { asyncHandler } from "@api/common";
import express from "express";
import mongoose from "mongoose";

import { ApplicationModel, StatusType } from "../models/application";
import { BranchModel, BranchType } from "../models/branch";

export const statisticsRouter = express.Router();

statisticsRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon } = req.query;

    /**
     * This aggregate gets:
     * a) users grouped by application status with frequency
     * b) an array of application data of the applications
     * c) application branches grouped by id with frequency
     * d) confirmation branches grouped by id with frequency
     * e) rejections grouped by application branch with frequency
     */
    const aggregatedApplications = await ApplicationModel.aggregate([
      {
        $match: {
          hexathon: new mongoose.Types.ObjectId(hexathon as string),
        },
      },
      {
        $facet: {
          users: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          applicationData: [
            {
              $group: {
                _id: "$applicationBranch",
                data: { $push: "$applicationData" },
              },
            },
          ],
          applicationBranches: [
            {
              $group: {
                _id: "$applicationBranch",
                count: { $sum: 1 },
              },
            },
          ],
          confirmationBranches: [
            {
              $group: {
                _id: "$confirmationBranch",
                count: { $sum: 1 },
              },
            },
          ],
          rejections: [
            {
              $match: { status: StatusType.DENIED },
            },
            {
              $group: {
                _id: "$applicationBranch",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const aggregatedUsers = aggregatedApplications[0].users;
    const aggregatedApplicationBranches = aggregatedApplications[0].applicationBranches;
    const aggregatedConfirmationBranches = aggregatedApplications[0].confirmationBranches;
    const aggregatedApplicationData = aggregatedApplications[0].applicationData;
    const aggregatedRejections = aggregatedApplications[0].rejections;

    /**
     * This aggregate gets the frequency of branches grouped by branch name.
     */

    const aggregatedBranches = await BranchModel.aggregate([
      {
        $match: {
          hexathon: new mongoose.Types.ObjectId(hexathon as string),
        },
      },
      {
        $group: {
          _id: "$name",
          branchId: { $first: "$_id" },
        },
      },
    ]);

    const branchMap: Record<string, string> = {};
    for (const element of aggregatedBranches) {
      const branch: string = element._id;
      branchMap[element.branchId.toString()] = branch;
    }

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
      const branch: string = branchMap[element._id];
      applicationStatistics = { ...applicationStatistics, [branch]: element.count };
    }

    for (const element of aggregatedConfirmationBranches) {
      if (branchMap[element._id]) {
        const branch: string = branchMap[element._id];
        confirmationStatistics = { ...confirmationStatistics, [branch]: element.count };
      }
    }

    for (const element of aggregatedRejections) {
      const branch: string = branchMap[element._id];
      rejectionStatistics = { ...rejectionStatistics, [branch]: element.count };
    }

    const statistics = {
      userStatistics,
      applicationStatistics,
      confirmationStatistics,
      rejectionStatistics,
      aggregatedApplicationData,
    };

    return res.send(statistics);
  })
);
