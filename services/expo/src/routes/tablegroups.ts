import express from "express";
import { BadRequestError, asyncHandler } from "@api/common";

import { prisma } from "../common";
import { getConfig, isAdmin } from "../utils/utils";
import { Prisma } from "@api/prisma-expo/generated";

export const tableGroupRoutes = express.Router();

tableGroupRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { hexathon } = req.query;
    const filter: Prisma.TableGroupWhereInput = {};

    if (hexathon !== undefined) {
      filter.hexathon = String(hexathon);
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
    const projects = await prisma.project.count({
      where: {
        tableGroupId: parseInt(req.params.id),
      },
    });

    if (projects > 0) {
      throw new BadRequestError("Cannot delete a table group with projects in it");
    }

    await prisma.tableGroup.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.status(204).end();
  })
);
