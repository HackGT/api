import express from "express";
import { Service } from "@api/config";
import { BadRequestError, apiCall, asyncHandler } from "@api/common";

import { prisma } from "../common";
import { getConfig, isAdminOrIsJudging } from "../utils/utils";

export const userRoutes = express.Router();

userRoutes.route("/check").get(
  asyncHandler(async (req, res) => {
    if (!req.user || !req.user.email) {
      throw new BadRequestError("Invalid user");
    }

    const config = await getConfig();

    let user = await prisma.user.findUnique({
      where: {
        email: req.user.email,
      },
      include: {
        categoryGroups: true,
      },
    });

    if (!user) {
      const response = await apiCall(
        Service.USERS,
        {
          url: `/users/${req.user.uid}`,
          method: "GET",
        },
        req
      );

      user = await prisma.user.create({
        data: {
          name: `${response.name.first} ${response.name.last}`,
          userId: req.user.uid,
          email: req.user.email,
        },
        include: {
          categoryGroups: true,
        },
      });
    }

    // Determines current category group based on current hexathon
    const currentCategoryGroup = user.categoryGroups.find(
      categoryGroup => categoryGroup.hexathon === config.currentHexathon
    );

    res.send({
      ...user,
      roles: req.user.roles,
      isJudging: !!currentCategoryGroup,
      isSponsor: currentCategoryGroup?.isSponsor ?? false,
    });
  })
);

// Filter using query string in url with parameters role and category
userRoutes.route("/").get(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      include: {
        assignments: {
          include: {
            project: {
              include: {
                ballots: {
                  select: {
                    score: true,
                    user: true,
                    criteria: true,
                  },
                },
                categories: true,
              },
            },
          },
        },
        categoryGroups: true,
        projects: {
          include: {
            categories: true,
          },
        },
      },
    });

    res.status(200).json(users);
  })
);
