import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { getCurrentHexathon } from "../utils/utils";
import { isAdmin } from "../auth/auth";

export const categoryGroupRoutes = express.Router();

categoryGroupRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon, name } = req.query;
    const filter: any = {};

    if (hexathon !== undefined) {
      filter.hexathon = hexathon;
    }

    if (name !== undefined) {
      filter.name = name;
    }

    const categoryGroups = await prisma.categoryGroup.findMany({
      where: filter,
      include: {
        categories: true,
        users: true,
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
    const categoryGroupId: number = parseInt(req.params.id);

    const updatedCategoryGroup = await prisma.categoryGroup.update({
      where: {
        id: categoryGroupId,
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
    const categoryGroupId: number = parseInt(req.params.id);

    const deletedCategoryGroup = await prisma.categoryGroup.deleteMany({
      where: {
        id: categoryGroupId,
      },
    });

    res.status(204).end();
  })
);
