import express from "express";
import { asyncHandler } from "@api/common";

import { prisma } from "../common";
import { isAdmin } from "../utils/utils";

export const judgingSessionRoutes = express.Router();

judgingSessionRoutes.route("/").get(
  isAdmin,
  asyncHandler(async (req, res) => {
    const { hexathon } = req.query;

    const sessions = await prisma.judgingSession.findMany({
      where: {
        ...(hexathon ? { hexathon: String(hexathon) } : {}),
      },
      include: {
        user: {
          include: {
            categoryGroups: {
              include: { categories: true },
            },
            assignments: {
              select: { status: true, projectId: true, categoryIds: true },
            },
          },
        },
      },
    });

    res.status(200).json(sessions);
  })
);
