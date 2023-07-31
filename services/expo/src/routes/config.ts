import { ConfigError, apiCall, asyncHandler } from "@api/common";
import { Service } from "@api/config";
import express from "express";

import { prisma } from "../common";
import { getConfig, isAdmin } from "../utils/utils";

export const configRoutes = express.Router();

function updateConfigFields(data: any, fields: string[]) {
  const filtered: any = {};

  Object.keys(data).forEach(key => {
    if (fields.includes(key)) {
      filtered[key] = data[key];
    }
  });

  return prisma.config.update({
    where: { id: 1 },
    data: filtered,
  });
}

configRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const config = await prisma.config.findFirst();
    if (!config) {
      throw new ConfigError("Config has not been setup. Please contact an admin.");
    }

    if (config.currentHexathon) {
      const hexathon = await apiCall(
        Service.HEXATHONS,
        {
          url: `/hexathons/${config.currentHexathon}`,
          method: "GET",
        },
        req
      );
      if (!hexathon) {
        throw new ConfigError("Invalid current hexathon");
      }
      res.status(200).json({
        ...config,
        currentHexathon: hexathon,
      });
    } else {
      res.status(200).json(config);
    }
  })
);

configRoutes.route("/").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const config = await getConfig();

    const updated = await prisma.config.update({
      where: {
        id: config.id,
      },
      data: req.body,
    });

    res.status(200).json(updated);
  })
);

configRoutes.route("/currentRoundExpo").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const update = await updateConfigFields(req.body, ["currentRound", "currentExpo"]);
    res.status(200).json(update);
  })
);

configRoutes.route("/isJudgingOn").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const update = await updateConfigFields(req.body, ["isJudgingOn"]);
    res.status(200).json(update);
  })
);

configRoutes.route("/isProjectsPublished").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const update = await updateConfigFields(req.body, ["isProjectsPublished"]);
    res.status(200).json(update);
  })
);

configRoutes.route("/isProjectSubmissionOpen").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const update = await updateConfigFields(req.body, ["isProjectSubmissionOpen"]);
    res.status(200).json(update);
  })
);

configRoutes.route("/currentHexathon").post(
  isAdmin,
  asyncHandler(async (req, res) => {
    const update = await updateConfigFields(req.body, ["currentHexathon"]);
    res.status(200).json(update);
  })
);
