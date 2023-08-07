import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { isAdmin } from "../utils/utils";

export const rubricRoutes = express.Router();

rubricRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const createdRubric = await prisma.rubric.create({
      data: req.body.data,
    });
    res.status(201).json(createdRubric);
  })
);

rubricRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const updatedRubric = await prisma.rubric.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: req.body,
    });

    res.status(200).json(updatedRubric);
  })
);

rubricRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    await prisma.rubric.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(204).end();
  })
);
