/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, checkAbility } from "@api/common";
import { Service } from "@api/config";
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
    let applicationBranchId = req.query.applicationBranch as string | undefined;
    let confirmationBranchId = req.query.confirmationBranch as string | undefined;
    const appStatus = req.query.status as StatusType | undefined;

    if (applicationBranchId === "") {
      applicationBranchId = undefined;
    }
    if (confirmationBranchId === "") {
      confirmationBranchId = undefined;
    }
    if (applicationBranchId && confirmationBranchId) {
      return res.status(400).send({
        message: "Cannot filter by both application and confirmation branch",
      });
    }

    const branches = await BranchModel.find({
      hexathon: new mongoose.Types.ObjectId(hexathon as string),
    });

    const interactions = await apiCall(
      Service.HEXATHONS,
      {
        url: `/interactions`,
        method: "GET",
        params: {
          hexathon,
        },
      },
      req
    );

    const checkinInteractions = interactions.reduce(
      (count: number, interaction: any) => (interaction.type === "check-in" ? count + 1 : count),
      0
    );

    const baseMatch = {
      hexathon: new mongoose.Types.ObjectId(hexathon as string),
    };

    const branchFilter: Record<string, any> = {};
    if (applicationBranchId) {
      branchFilter.applicationBranch = new mongoose.Types.ObjectId(applicationBranchId);
    } else if (confirmationBranchId) {
      // can't have both application and confirmation branch
      branchFilter.confirmationBranch = new mongoose.Types.ObjectId(confirmationBranchId);
    }

    const statusFilter: Record<string, any> = {};
    if (appStatus) {
      statusFilter.status = appStatus;
    }

    const aggregatedApplications = await ApplicationModel.aggregate([
      {
        $match: baseMatch,
      },
      {
        $facet: {
          // users grouped by application status with frequency
          users: [
            {
              $match: branchFilter,
            },
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
                ...branchFilter,
                ...statusFilter,
                "applicationData.gender": { $ne: null },
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
                ...branchFilter,
                ...statusFilter,
                "applicationData.schoolYear": { $ne: null },
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
                ...branchFilter,
                ...statusFilter,
                "applicationData.major": { $ne: null },
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
                ...branchFilter,
                ...statusFilter,
                "applicationData.school": { $ne: null },
              },
            },
            {
              $group: {
                _id: "$applicationData.school",
                count: { $sum: 1 },
              },
            },
          ],
          // marketing data for applied applications
          marketingData: [
            {
              $match: {
                ...branchFilter,
                ...statusFilter,
                "applicationData.marketing": { $ne: null },
              },
            },
            {
              $group: {
                _id: "$applicationData.marketing",
                count: { $sum: 1 },
              },
            },
          ],
          // shirt size data for applied applications
          shirtSizeData: [
            {
              $match: {
                ...branchFilter,
                ...statusFilter,
                "applicationData.shirtSize": { $ne: null },
              },
            },
            {
              $group: {
                _id: "$applicationData.shirtSize",
                count: { $sum: 1 },
              },
            },
          ],
          // dietary restrictions data for applied applications
          dietaryRestrictionsData: [
            {
              $match: {
                ...branchFilter,
                ...statusFilter,
                "applicationData.dietaryRestrictions": { $ne: null },
              },
            },
            {
              $unwind: "$applicationData.dietaryRestrictions",
            },
            {
              $group: {
                _id: "$applicationData.dietaryRestrictions",
                count: { $sum: 1 },
              },
            },
          ],
          // track preference data for applied applications
          trackPreferenceData: [
            {
              $match: {
                ...branchFilter,
                ...statusFilter,
                "applicationData.customData.track": { $ne: null },
              },
            },
            {
              $group: {
                _id: "$applicationData.customData.track",
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
                confirmationBranch: { $ne: null },
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
        (allUsersStatusCount.CHECKED_IN || 0) +
        (allUsersStatusCount.NOT_ATTENDING || 0),
      confirmedUsers: allUsersStatusCount.CONFIRMED || 0,
      waitlistedUsers: allUsersStatusCount.WAITLISTED || 0,
      withdrawnUsers: allUsersStatusCount.NOT_ATTENDING || 0,
      checkedinUsers: checkinInteractions, // Physical check-in interactions
      checkedInStatusUsers: allUsersStatusCount.CHECKED_IN || 0, // Application status count
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

    const eventInteractions = interactions.filter(
      (interaction: any) => interaction.type === "event"
    );

    const eventInteractionStatistics: {
      [date: string]: {
        [type: string]: {
          [name: string]: number;
        };
      };
    } = {};

    for (const interaction of eventInteractions) {
      if (!interaction.event) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const event = interaction.event;
      const date = new Date(interaction.timestamp).toLocaleDateString();
      const type = event.type;

      if (!(date in eventInteractionStatistics)) {
        eventInteractionStatistics[date] = {};
      }

      if (!(type in eventInteractionStatistics[date])) {
        eventInteractionStatistics[date][type] = {};
      }

      if (!(event.name in eventInteractionStatistics[date][type])) {
        eventInteractionStatistics[date][type][event.name] = 0;
      }

      eventInteractionStatistics[date][type][event.name] += 1;
    }

    // CALCULATES APPLICATION DATA STATISTICS

    const applicationDataStatistics = {
      genderData: transformAggregateArray(aggregatedApplications[0].genderData),
      schoolData: transformAggregateArray(aggregatedApplications[0].schoolData),
      majorData: transformAggregateArray(aggregatedApplications[0].majorData),
      schoolYearData: transformAggregateArray(aggregatedApplications[0].schoolYearData),
      marketingData: transformAggregateArray(aggregatedApplications[0].marketingData),
      shirtSizeData: transformAggregateArray(aggregatedApplications[0].shirtSizeData),
      dietaryRestrictionsData: transformAggregateArray(
        aggregatedApplications[0].dietaryRestrictionsData
      ),
      trackPreferenceData: transformAggregateArray(aggregatedApplications[0].trackPreferenceData),
    };

    return res.send({
      userStatistics,
      applicationStatistics: applicationBranchStatistics,
      confirmationStatistics: confirmationBranchStatistics,
      applicationDataStatistics,
      eventInteractionStatistics,
    });
  })
);
