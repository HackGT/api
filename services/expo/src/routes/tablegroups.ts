import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { getConfig, isAdmin } from "../utils/utils";

export const tableGroupRoutes = express.Router();

tableGroupRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon } = req.query;
    const filter: any = {};

    if (hexathon !== undefined) {
      filter.hexathon = hexathon;
    }

    const tableGroups = await prisma.tableGroup.findMany({ where: filter });
    res.status(200).json(tableGroups);
  })
);

tableGroupRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    const tableGroup = await prisma.tableGroup.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(200).json(tableGroup);
  })
);

// TODO: Fix this route. Should projects have a default table group?
// Get by projectId
tableGroupRoutes.route("/project/:id").get(
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    const tableGroup = await prisma.tableGroup.findUnique({
      where: {
        id: project?.tableGroupId || 1,
      },
    });
    res.status(200).json(tableGroup);
  })
);

tableGroupRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const config = await getConfig();

    const createdTableGroup = await prisma.tableGroup.create({
      data: {
        ...req.body,
        hexathon: config.currentHexathon,
      },
    });

    res.status(201).json(createdTableGroup);
  })
);

tableGroupRoutes.route("/:id").patch(
  isAdmin,
  asyncHandler(async (req, res) => {
    const updatedTableGroup = await prisma.tableGroup.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: req.body,
    });

    res.status(200).json(updatedTableGroup);
  })
);

tableGroupRoutes.route("/:id").delete(
  isAdmin,
  asyncHandler(async (req, res) => {
    const deletedCategoryGroup = await prisma.tableGroup.deleteMany({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(204).end();
  })
);
