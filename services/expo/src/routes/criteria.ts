import express from "express";
import { asyncHandler } from "@api/common";

import { Prisma } from "@api/prisma-expo/generated";
import { prisma } from "../common";
import { isAdmin } from "../utils/utils";

export const criteriaRoutes = express.Router();

criteriaRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: Prisma.CriteriaWhereInput = {};

    if (req.query.category !== undefined) {
      filter.categoryId = parseInt(req.query.category as string);
    }

    const criteria = await prisma.criteria.findMany({
      where: filter,
      include: {
        ballots: true,
      },
    });
    res.status(200).json(criteria);
  })
);

criteriaRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const createdCriteria = await prisma.criteria.create({
      data: req.body,
    });
    res.status(201).json(createdCriteria);
  })
);

criteriaRoutes.route("/batch/create").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const createdCriterias = await prisma.criteria.createMany({
      data: req.body.data,
    });
    res.status(201).json(createdCriterias);
  })
);

criteriaRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const updatedCriteria = await prisma.criteria.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: req.body,
    });

    res.status(200).json(updatedCriteria);
  })
);

criteriaRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    await prisma.criteria.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(204).end();
  })
);
