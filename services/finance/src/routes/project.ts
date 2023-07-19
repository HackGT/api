import express from "express";
import { BadRequestError, apiCall, asyncHandler, checkAbility } from "@api/common";
import { Service } from "@api/config";
import _ from "lodash";

import { Prisma, Project, Requisition, User } from "@api/prisma/generated";
import { prisma } from "../common";
import { PROJECT_INCLUDE } from "../util/common";

/**
 * Fills in detailed information for a project from other api services
 */
const fillProject = async (
  project: Project & { leads: User[]; requisitions: Requisition[] },
  req: express.Request
) => {
  const userProfiles = await apiCall(
    Service.USERS,
    {
      url: "/users/actions/retrieve",
      method: "POST",
      data: {
        userIds: _.flattenDeep([
          project.leads.map(lead => lead.userId),
          project.requisitions.map(requisition => requisition.createdById),
        ]),
      },
    },
    req
  );

  return {
    ...project,
    leads: project.leads.map(lead => userProfiles.find((user: any) => user.userId === lead.userId)),
    requisitions: project.requisitions.map(requisition => ({
      ...requisition,
      createdBy: userProfiles.find((user: any) => user.userId === requisition.createdById),
    })),
  };
};

/**
 * Fills in detailed information for multiple projects from other api services
 */
const fillProjects = async (projects: (Project & { leads: User[] })[], req: express.Request) => {
  const userProfiles = await apiCall(
    Service.USERS,
    {
      url: `/users/actions/retrieve`,
      method: "POST",
      data: {
        userIds: _.flattenDeep(projects.map(project => project.leads.map(lead => lead.userId))),
      },
    },
    req
  );

  return projects.map(project => ({
    ...project,
    leads: project.leads.map(lead => userProfiles.find((user: any) => user.userId === lead.userId)),
  }));
};

export const projectRoutes = express.Router();

projectRoutes.route("/").get(
  checkAbility("read", "Project"),
  asyncHandler(async (req, res) => {
    const filter: Prisma.ProjectWhereInput = {};

    if (req.query.archived) {
      filter.archived = req.query.archived === "true";
    }

    const projects = await prisma.project.findMany({
      where: filter,
      include: PROJECT_INCLUDE,
    });
    const filledProjects = await fillProjects(projects, req);
    return res.status(200).json(filledProjects);
  })
);

projectRoutes.route("/:referenceString").get(
  checkAbility("read", "Project"),
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: {
        referenceString: req.params.referenceString,
      },
      include: PROJECT_INCLUDE,
    });
    if (!project) {
      throw new BadRequestError("Project not found");
    }

    const filledProject = await fillProject(project, req);
    return res.status(200).json(filledProject);
  })
);

projectRoutes.route("/").post(
  checkAbility("create", "Project"),
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
  checkAbility("update", "Project"),
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
            set: req.body.leads.map((lead: any) => ({ userId: lead })),
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
