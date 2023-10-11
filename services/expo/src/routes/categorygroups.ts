import express from "express";
import { BadRequestError, asyncHandler } from "@api/common";

import { prisma } from "../common";
import { getCurrentHexathon, isAdmin } from "../utils/utils";
import { Prisma } from "@api/prisma-expo/generated";

export const categoryGroupRoutes = express.Router();

categoryGroupRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon, name } = req.query;
    const filter: Prisma.CategoryGroupWhereInput = {};

    if (hexathon !== undefined) {
      filter.hexathon = hexathon as string;
    }

    if (name !== undefined) {
      filter.name = name as string;
    }

    const categoryGroups = await prisma.categoryGroup.findMany({
      where: filter,
      include: {
        categories: true,
        users: {
          include: {
            assignments: {
              include: {
                project: {
                  include: {
                    categories: true,
                    ballots: {
                      include: {
                        criteria: true,
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json(categoryGroups);
  })
);

categoryGroupRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    const categoryGroup = await prisma.categoryGroup.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        categories: true,
      },
    });

    res.status(200).json(categoryGroup);
  })
);

categoryGroupRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const currentHexathon = await getCurrentHexathon(req);

    // Throw error if users already have a category group for this hexathon
    if (req.body.users) {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: req.body.users,
          },
        },
        include: {
          categoryGroups: true,
        },
      });

      const usersWithCategoryGroup = users.filter(user =>
        user.categoryGroups.some(categoryGroup => categoryGroup.hexathon === currentHexathon.id)
      );
      if (usersWithCategoryGroup.length > 0) {
        throw new BadRequestError(
          `User(s) ${usersWithCategoryGroup
            .map(user => user.name)
            .join(", ")} already have a category group for this hexathon`
        );
      }
    }

    const createdCategoryGroup = await prisma.categoryGroup.create({
      data: {
        ...req.body,
        categories: { connect: req.body.categories?.map((id: number) => ({ id })) ?? undefined },
        users: { connect: req.body.users?.map((id: number) => ({ id })) ?? undefined },
        hexathon: currentHexathon.id,
      },
    });
    res.status(201).json(createdCategoryGroup);
  })
);

categoryGroupRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const currentHexathon = await getCurrentHexathon(req);

    // Throw error if users already have a category group for this hexathon
    if (req.body.users) {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: req.body.users,
          },
        },
        include: {
          categoryGroups: true,
        },
      });

      const usersWithCategoryGroup = users.filter(user =>
        user.categoryGroups.some(
          categoryGroup =>
            categoryGroup.hexathon === currentHexathon.id &&
            categoryGroup.id !== parseInt(req.params.id)
        )
      );
      if (usersWithCategoryGroup.length > 0) {
        throw new BadRequestError(
          `User(s) ${usersWithCategoryGroup
            .map(user => user.name)
            .join(", ")} already have a category group for this hexathon`
        );
      }
    }

    const updatedCategoryGroup = await prisma.categoryGroup.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        ...req.body,
        categories: {
          set: req.body.categories?.map((id: number) => ({ id })) ?? undefined,
        },
        users: {
          set: req.body.users?.map((id: number) => ({ id })) ?? undefined,
        },
      },
    });

    res.status(200).json(updatedCategoryGroup);
  })
);

categoryGroupRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    await prisma.categoryGroup.deleteMany({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(204).end();
  })
);
