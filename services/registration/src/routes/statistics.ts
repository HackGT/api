/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
import { asyncHandler, checkAbility } from "@api/common";
import express from "express";
import mongoose from "mongoose";

import { ApplicationModel, StatusType } from "../models/application";
import { BranchModel, BranchType } from "../models/branch";

export const statisticsRouter = express.Router();

/**
 * Transforms the array result of a MongoDB aggregation query into a map
 * @param array the aggregate array
 * @returns the result with keys mapped to their counts
 */
const transformAggregateArray = (array: any[]) =>
  array.reduce((prev, curr) => {
    prev[curr._id] = curr.count; // eslint-disable-line no-param-reassign
    return prev;
  }, {});

statisticsRouter.route("/").get(
  checkAbility("aggregate", "Application"),
  asyncHandler(async (req, res) => {
    const { hexathon } = req.query;

    const branches = await BranchModel.find({
      hexathon: new mongoose.Types.ObjectId(hexathon as string),
    });

    const aggregatedApplications = await ApplicationModel.aggregate([
      {
        $match: {
          hexathon: new mongoose.Types.ObjectId(hexathon as string),
        },
      },
      {
        $facet: {
          // users grouped by application status with frequency
          users: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          // gender data for applied applications
          genderData: [
            {
              $match: {
                "status": { $ne: StatusType.DRAFT },
                "applicationData.gender": { $exists: true },
              },
            },
            {
              $group: {
                _id: "$applicationData.gender",
                count: { $sum: 1 },
              },
            },
          ],
          // school year data for applied applications
          schoolYearData: [
            {
              $match: {
                "status": { $ne: StatusType.DRAFT },
                "applicationData.schoolYear": { $exists: true },
              },
            },
            {
              $group: {
                _id: "$applicationData.schoolYear",
                count: { $sum: 1 },
              },
            },
          ],
          // major data for applied applications
          majorData: [
            {
              $match: {
                "status": { $ne: StatusType.DRAFT },
                "applicationData.major": { $exists: true },
              },
            },
            {
              $group: {
                _id: "$applicationData.major",
                count: { $sum: 1 },
              },
            },
          ],
          // school data for applied applications
          schoolData: [
            {
              $match: {
                "status": { $ne: StatusType.DRAFT },
                "applicationData.school": { $exists: true },
              },
            },
            {
              $group: {
                _id: "$applicationData.school",
                count: { $sum: 1 },
              },
            },
          ],
          // groups all applications by application branch and status
          applicationBranches: [
            {
              $group: {
                _id: {
                  applicationBranch: "$applicationBranch",
                  status: "$status",
                },
                count: { $sum: 1 },
              },
            },
          ],
          // groups all applications with a confirmation branch by confirmation branch and status
          confirmationBranches: [
            {
              $match: {
                confirmationBranch: { $exists: true },
              },
            },
            {
              $group: {
                _id: {
                  confirmationBranch: "$confirmationBranch",
                  status: "$status",
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const aggregatedUsers: any[] = aggregatedApplications[0].users;
    const aggregatedApplicationBranches: any[] = aggregatedApplications[0].applicationBranches;
    const aggregatedConfirmationBranches: any[] = aggregatedApplications[0].confirmationBranches;

    // CALCULATE ALL USER STATISTICS

    const allUsersTotal = aggregatedUsers.reduce((acc, aggregate) => acc + aggregate.count, 0);
    const allUsersStatusCount: {
      [status in StatusType]?: number;
    } = {};
    for (const element of aggregatedUsers) {
      allUsersStatusCount[element._id as keyof typeof StatusType] = element.count;
    }

    const userStatistics = {
      totalUsers: allUsersTotal,
      appliedUsers: allUsersTotal - (allUsersStatusCount.DRAFT || 0),
      acceptedUsers:
        (allUsersStatusCount.ACCEPTED || 0) +
        (allUsersStatusCount.CONFIRMED || 0) +
        (allUsersStatusCount.NOT_ATTENDING || 0),
      confirmedUsers: allUsersStatusCount.CONFIRMED || 0,
      deniedUsers: allUsersStatusCount.DENIED || 0,
    };

    // CALCULATES BRANCH SPECIFIC STATISTICS

    const applicationBranchStatistics: {
      [name: string]: {
        draft: number;
        applied: number;
        decisionPending: number;
        accepted: number;
        waitlisted: number;
        denied: number;
        total: number;
      };
    } = {};
    const confirmationBranchStatistics: {
      [name: string]: {
        confirmed: number;
        notAttending: number;
        total: number;
      };
    } = {};

    for (const branch of branches) {
      // Maps status to count
      const statusCount: {
        [status in StatusType]?: number;
      } = {};

      if (branch.type === BranchType.APPLICATION) {
        const branchAggregates = aggregatedApplicationBranches.filter(aggregate =>
          aggregate._id.applicationBranch.equals(branch._id)
        );
        for (const aggregate of branchAggregates) {
          statusCount[aggregate._id.status as keyof typeof StatusType] = aggregate.count;
        }

        // Gets total count of applications
        const numTotal = branchAggregates.reduce((acc, aggregate) => acc + aggregate.count, 0);

        applicationBranchStatistics[branch.name] = {
          draft: statusCount[StatusType.DRAFT] || 0,
          applied: numTotal - (statusCount[StatusType.DRAFT] || 0),
          decisionPending: statusCount[StatusType.APPLIED] || 0,
          accepted:
            (statusCount[StatusType.ACCEPTED] || 0) +
            (statusCount[StatusType.CONFIRMED] || 0) +
            (statusCount[StatusType.NOT_ATTENDING] || 0),
          waitlisted: statusCount[StatusType.WAITLISTED] || 0,
          denied: statusCount[StatusType.DENIED] || 0,
          total: numTotal,
        };
      } else if (branch.type === BranchType.CONFIRMATION) {
        const branchAggregates = aggregatedConfirmationBranches.filter(aggregate =>
          aggregate._id.confirmationBranch.equals(branch._id)
        );
        for (const aggregate of branchAggregates) {
          statusCount[aggregate._id.status as keyof typeof StatusType] = aggregate.count;
        }

        // Gets total count of applications
        const numTotal = branchAggregates.reduce((acc, aggregate) => acc + aggregate.count, 0);

        confirmationBranchStatistics[branch.name] = {
          confirmed: statusCount[StatusType.CONFIRMED] || 0,
          notAttending: statusCount[StatusType.NOT_ATTENDING] || 0,
          total: numTotal,
        };
      }
    }

    // CALCULATES APPLICATION DATA STATISTICS

    const applicationDataStatistics = {
      genderData: transformAggregateArray(aggregatedApplications[0].genderData),
      schoolData: transformAggregateArray(aggregatedApplications[0].schoolData),
      majorData: transformAggregateArray(aggregatedApplications[0].majorData),
      schoolYearData: transformAggregateArray(aggregatedApplications[0].schoolYearData),
    };

    return res.send({
      userStatistics,
      applicationStatistics: applicationBranchStatistics,
      confirmationStatistics: confirmationBranchStatistics,
      applicationDataStatistics,
    });
  })
);
