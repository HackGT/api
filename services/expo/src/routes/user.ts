import express from "express";
import { Service } from "@api/config";
import { BadRequestError, apiCall, asyncHandler } from "@api/common";

import { prisma } from "../common";
import { isAdmin } from "../utils/utils";

export const userRoutes = express.Router();

userRoutes.route("/check").get(
  asyncHandler(async (req, res) => {
    if (!req.user || !req.user.email) {
      throw new BadRequestError("Invalid user");
    }

    let user = await prisma.user.findUnique({
      where: {
        email: req.user.email,
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
          isJudging: false,
        },
      });
    }

    res.send({
      ...user,
      roles: req.user.roles,
    });
  })
);

// Filter using query string in url with parameters role and category
userRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const categoryFilter = (req.query.category as string) || null;
    let roleFilter = (req.query.role as string) || null;
    const filter: any = {};

    if (categoryFilter !== null) {
      const categoryId = parseInt(categoryFilter);
      filter.categoryGroupId = categoryId;
    }

    if (roleFilter !== null) {
      roleFilter = roleFilter.toUpperCase();
      filter.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where: filter,
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
        categoryGroup: true,
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

// Update user
userRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const data: any = {};
    Object.keys(req.body).forEach(key => {
      if (["name", "categoryGroupId", "isJudging"].includes(key)) {
        data[key] = req.body[key];
      }
    });

    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(req.params.id),
      },
      data,
    });

    res.status(200).json(updatedUser);
  })
);
