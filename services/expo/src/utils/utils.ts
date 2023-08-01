import { apiCall, ConfigError, ForbiddenError } from "@api/common";
import { Service } from "@api/config";
import express from "express";

import { prisma } from "../common";

export const getConfig = async () => {
  const config = await prisma.config.findFirst();

  if (!config) {
    throw new Error("Config does not exist. Please ensure your database is setup properly.");
  }

  return config;
};

export const getCurrentHexathon = async (request: express.Request) => {
  const config = await getConfig();
  if (!config.currentHexathon) {
    throw new ConfigError("Current hexathon is not setup yet.");
  }

  const hexathon = await apiCall(
    Service.HEXATHONS,
    {
      url: `/hexathons/${config.currentHexathon}`,
      method: "GET",
    },
    request
  );
  if (!hexathon) {
    throw new ConfigError("Invalid current hexathon");
  }

  return hexathon;
};

export const isAdminOrIsJudging = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  const user = await prisma.user.findUnique({
    where: {
      userId: request.user?.uid,
    },
  });
  if (!user || !(request.user?.roles.admin || user.isJudging)) {
    throw new ForbiddenError("Sorry, you don't have access to this endpoint.");
  }
  next();
};

export const isAdmin = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  if (!request.user?.roles.admin) {
    throw new ForbiddenError("Sorry, you don't have access to this endpoint.");
  }
  next();
};
