import express from "express";
import { asyncHandler, checkAbility } from "@api/common";

import { Prisma } from "@api/prisma-finance/generated";
import { prisma } from "../common";
import { BUDGET_INCLUDE, CATEGORY_INCLUDE } from "../util/common";

export const budgetRoutes = express.Router();

budgetRoutes.route("/").get(
  checkAbility("read", "Budget"),
  asyncHandler(async (req, res) => {
    const filter: Prisma.BudgetWhereInput = {};

    if (req.query.archived) {
      filter.archived = req.query.archived === "true";
    }

    const budgets = await prisma.budget.findMany({
      where: filter,
      include: BUDGET_INCLUDE,
    });
    return res.status(200).json(budgets);
  })
);

budgetRoutes.route("/:id").get(
  checkAbility("read", "Budget"),
  asyncHandler(async (req, res) => {
    const budget = await prisma.budget.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: BUDGET_INCLUDE,
    });
    return res.status(200).json(budget);
  })
);

budgetRoutes.route("/").post(
  checkAbility("create", "Budget"),
  asyncHandler(async (req, res) => {
    const newBudget = await prisma.budget.create({
      data: {
        ...req.body,
        archived: req.body.archived ?? undefined,
      },
    });
    return res.status(200).json(newBudget);
  })
);

budgetRoutes.route("/:id").put(
  checkAbility("update", "Budget"),
  asyncHandler(async (req, res) => {
    const updatedBudget = await prisma.budget.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        ...req.body,
        archived: req.body.archived ?? undefined,
      },
    });
    return res.status(200).json(updatedBudget);
  })
);

budgetRoutes.route("/:budgetId/categories").post(
  checkAbility("update", "Budget"),
  asyncHandler(async (req, res) => {
    const newCategory = await prisma.category.create({
      data: {
        ...req.body,
        budget: {
          connect: {
            id: parseInt(req.params.budgetId),
          },
        },
      },
      include: CATEGORY_INCLUDE,
    });
    return res.status(200).json(newCategory);
  })
);

budgetRoutes.route("/:budgetId/categories/:categoryId").put(
  checkAbility("update", "Budget"),
  asyncHandler(async (req, res) => {
    const updatedCategory = await prisma.category.update({
      where: {
        id: parseInt(req.params.categoryId),
      },
      data: {
        ...req.body,
        budget: {
          connect: {
            id: parseInt(req.params.budgetId),
          },
        },
      },
      include: CATEGORY_INCLUDE,
    });
    return res.status(200).json(updatedCategory);
  })
);

budgetRoutes.route("/:budgetId/categories/:categoryId/line-items").post(
  checkAbility("update", "Budget"),
  asyncHandler(async (req, res) => {
    const newLineItem = await prisma.lineItem.create({
      data: {
        ...req.body,
        category: {
          connect: {
            id: parseInt(req.params.categoryId),
          },
        },
      },
    });
    return res.status(200).json(newLineItem);
  })
);

budgetRoutes.route("/:budgetId/categories/:categoryId/line-items/:lineItemId").put(
  checkAbility("update", "Budget"),
  asyncHandler(async (req, res) => {
    const updatedLineItem = await prisma.lineItem.update({
      where: {
        id: parseInt(req.params.lineItemId),
      },
      data: {
        ...req.body,
        category: {
          connect: {
            id: parseInt(req.params.categoryId),
          },
        },
      },
    });
    return res.status(200).json(updatedLineItem);
  })
);
