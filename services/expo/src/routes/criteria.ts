import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { isAdmin } from "../auth/auth";

export const criteriaRoutes = express.Router();

criteriaRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { category } = req.query;
    const filter: any = {};

    if (category !== undefined) {
      const categoryId: number = parseInt(category as string);
      filter.categoryId = categoryId;
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
    const criteriaId: number = parseInt(req.params.id);

    const updatedCriteria = await prisma.criteria.update({
      where: {
        id: criteriaId,
      },
      data: req.body,
    });

    res.status(200).json(updatedCriteria);
  })
);

criteriaRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    const criteriaId: number = parseInt(req.params.id);

    const deletedCriteria = await prisma.criteria.delete({
      where: {
        id: criteriaId,
      },
    });

    res.status(204).end();
  })
);
