import express from "express";
import { asyncHandler } from "@api/common";

import { Prisma } from "@api/prisma/generated";
import { prisma } from "../common";
import { PROJECT_INCLUDE } from "../util/common";

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

projectRoutes.route("/:referenceString").get(
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: {
        referenceString: req.params.referenceString,
      },
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
        referenceString: `${req.body.year}-${req.body.shortCode}`,
        archived: req.body.archived ?? false,
        leads: {
          connect: req.body.leads?.map((lead: any) => ({ userId: lead })),
        },
      },
      include: PROJECT_INCLUDE,
    });
    return res.status(200).json(newProject);
  })
);

projectRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    const newProjectReferenceString = `${req.body.year}-${req.body.shortCode}`;

    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: {
          id: parseInt(req.params.id),
        },
        data: {
          ...req.body,
          referenceString: newProjectReferenceString,
          archived: req.body.archived ?? undefined,
          leads: {
            connect: req.body.leads.map((lead: any) => ({ userId: lead })),
          },
        },
        include: PROJECT_INCLUDE,
      }),
      // Update all requisitions with the new project reference string
      prisma.$executeRaw(
        Prisma.sql`UPDATE requisition SET "referenceString" = ${newProjectReferenceString} || '-' || "projectRequisitionId"
      WHERE "projectId" = ${parseInt(req.params.id)}`
      ),
    ]);

    return res.status(200).json(updatedProject);
  })
);
