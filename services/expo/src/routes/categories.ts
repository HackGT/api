import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { getConfig } from "../utils/utils";
import { isAdmin } from "../auth/auth";

export const categoryRoutes = express.Router();

categoryRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon, categoryGroup } = req.query;
    const filter: any = {};

    if (hexathon !== undefined) {
      filter.hexathon = hexathon;
    }

    if (categoryGroup !== undefined) {
      const categoryGroupId: number = parseInt(categoryGroup as string);
      filter.categoryGroups = {
        some: { id: categoryGroupId },
      };
    }

    const categories = await prisma.category.findMany({
      where: filter,
      include: {
        criterias: {
          include: {
            ballots: true,
          },
        },
        projects: true,
      },
    });
    res.status(200).json(categories);
  })
);

categoryRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const config = await getConfig();

    const createdCategory = await prisma.category.create({
      data: {
        ...req.body,
        criterias: {
          create: req.body.criterias,
        },
        hexathon: config.currentHexathon,
      },
      include: { criterias: true },
    });
    res.status(201).json(createdCategory);
  })
);

categoryRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const categoryId = parseInt(req.params.id);

    const originalCategory = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        criterias: true,
      },
    });

    if (!originalCategory) {
      res.status(400).send({ error: true, message: "This category does not exist." });
      return;
    }

    const criteriaUpdate: any = {};
    const oldCriteriaIds: number[] = originalCategory.criterias
      .map((criteria: any) => criteria.id)
      .filter((id: any) => id);
    const newCriteriaIds: number[] = req.body.criterias
      .map((criteria: any) => criteria.id)
      .filter((id: any) => id);

    for (const criteria of req.body.criterias) {
      if (oldCriteriaIds.includes(criteria.id)) {
        criteriaUpdate.updateMany = criteriaUpdate.updateMany || [];
        criteriaUpdate.updateMany.push({
          where: {
            id: criteria.id,
          },
          data: {
            name: criteria.name,
            description: criteria.description,
            minScore: criteria.minScore,
            maxScore: criteria.maxScore,
          },
        });
      } else {
        criteriaUpdate.create = criteriaUpdate.create || [];
        criteriaUpdate.create.push({
          name: criteria.name,
          description: criteria.description,
          minScore: criteria.minScore,
          maxScore: criteria.maxScore,
        });
      }
    }

    for (const oldCriteriaId of oldCriteriaIds) {
      if (!newCriteriaIds.includes(oldCriteriaId)) {
        criteriaUpdate.delete = criteriaUpdate.update || [];
        criteriaUpdate.delete.push({
          id: oldCriteriaId,
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        ...req.body,
        criterias: criteriaUpdate,
      },
      include: { criterias: true },
    });

    res.status(200).json(updatedCategory);
  })
);

categoryRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    const categoryId: number = parseInt(req.params.id);

    const deletedCriteria = await prisma.criteria.deleteMany({
      where: {
        categoryId,
      },
    });

    const deletedCategory = await prisma.category.delete({
      where: {
        id: categoryId,
      },
      include: { criterias: true },
    });

    res.status(204).end();
  })
);
