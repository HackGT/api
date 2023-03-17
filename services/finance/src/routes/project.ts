import express from "express";
import { asyncHandler } from "@api/common";

import { Prisma } from "@api/prisma/generated";
import { prisma } from "../common";
import { PROJECT_INCLUDE } from "../api/resolvers/common";

export const projectRoutes = express.Router();

projectRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: Prisma.ProjectWhereInput = {};

    if (req.query.archived) {
      filter.archived = req.query.archived === "true";
    }

    const projects = await prisma.project.findMany({
      where: filter,
      include: PROJECT_INCLUDE,
    });
    return res.status(200).json(projects);
  })
);

projectRoutes.route("/:code").get(
  asyncHandler(async (req, res) => {
    const [year, shortCode] = req.params.code.split("-");

    const filter: Prisma.ProjectWhereInput = {
      year: parseInt(year),
      shortCode,
    };

    const project = await prisma.project.findFirst({
      where: filter,
      include: PROJECT_INCLUDE,
    });
    return res.status(200).json(project);
  })
);

projectRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const newProject = await prisma.project.create({
      data: {
        ...req.body,
        archived: req.body.archived ?? false,
        leads: {
          connect: req.body.leads?.map((lead: any) => ({ id: lead })),
        },
      },
      include: PROJECT_INCLUDE,
    });
    return res.status(200).json(newProject);
  })
);

projectRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    const updatdProject = await prisma.project.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        ...req.body,
        archived: req.body.archived ?? undefined,
        leads: {
          connect: req.body.leads.map((lead: any) => ({ id: lead })),
        },
      },
      include: PROJECT_INCLUDE,
    });
    return res.status(200).json(updatdProject);
  })
);
