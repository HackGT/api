import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { prisma } from "../common";

export const categoryRouter = express.Router();

categoryRouter.route("/").get(
  checkAbility("read", "Category"),
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany();

    res.status(200).send(categories);
  })
);

categoryRouter.route("/").post(
  checkAbility("create", "Category"),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({
      data: {
        name: req.body.name,
      },
    });

    res.status(200).send(category);
  })
);

categoryRouter.route("/:id").patch(
  checkAbility("update", "Category"),
  asyncHandler(async (req, res) => {
    const updatedCategory = await prisma.category.update({
      data: {
        name: req.body.name,
      },
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(200).send(updatedCategory);
  })
);
