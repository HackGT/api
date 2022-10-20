import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { isAdmin } from "../auth/auth";

export const rubricRoutes = express.Router();

// route to get all rubrics for a specific criteria
rubricRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    const criteriaId: number = parseInt(req.params.id);

    const rubrics = await prisma.rubric.findMany({
      where: {
        criteriaId,
      },
    });

    res.status(200).json(rubrics);
  })
);

// route to add a rubric
rubricRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const createdRubric = await prisma.rubric.create({
      data: req.body.data,
    });
    res.status(201).json(createdRubric);
  })
);

// route to add multiple rubrics
rubricRoutes.route("/batch/create").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const createdRubrics = await prisma.rubric.createMany({
      data: req.body.data,
    });
    res.status(201).json(createdRubrics);
  })
);

// route to edit a rubric
rubricRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const rubricId: number = parseInt(req.params.id);

    const updatedRubric = await prisma.rubric.update({
      where: {
        id: rubricId,
      },
      data: req.body,
    });

    res.status(200).json(updatedRubric);
  })
);

// route to delete a rubric
rubricRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    const rubricId: number = parseInt(req.params.id);

    const deletedRubric = await prisma.rubric.delete({
      where: {
        id: rubricId,
      },
    });

    res.status(204).end();
  })
);
