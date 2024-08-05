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
// Offset pagination with skip (how many front items to skip) and take (how many items to return) params
// Supports filtering by id, name, email, userId
userRoutes.route("/").get(
  isAdminOrIsJudging,
  asyncHandler(async (req, res) => {
    const { skip, take, id, name, email, userId } = req.query;
    const users = await prisma.user.findMany({
      skip: skip ? parseInt(skip as string) : 0,
      take: take ? parseInt(take as string) : undefined,
      where: {
        id: id ? parseInt(id as string) : undefined,
        name: name ? (name as string) : undefined,
        email: email ? (email as string) : undefined,
        userId: userId ? (userId as string) : undefined,
      },
      include: {
        categoryGroups: true,
      },
    });

    res.status(200).json(users);
  })
);
