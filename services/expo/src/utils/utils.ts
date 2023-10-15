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
  const [user, config] = await Promise.all([
    prisma.user.findUnique({
      where: {
        userId: request.user?.uid,
      },
      include: {
        categoryGroups: true,
      },
    }),
    getConfig(),
  ]);

  // Find assigned category groups for current hexathon if exists
  const hasCurrentCategoryGroup =
    user?.categoryGroups.some(categoryGroup => categoryGroup.hexathon === config.currentHexathon) ??
    false;

  if (!user || !(request.user?.roles.admin || hasCurrentCategoryGroup)) {
    throw new ForbiddenError("Sorry, you don't have access to this endpoint.");
  }
  next();
};

export const calculateMeanAndStandardDeviation = (
  ...numbers: number[]
): { mean: number; standardDeviation: number } => {
  // Calculate the mean
  const mean: number = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

  const squaredDifferences: number[] = numbers.map(number => Math.pow(number - mean, 2));

  const averageSquaredDifference: number =
    squaredDifferences.reduce((sum, value) => sum + value, 0) / squaredDifferences.length;

  const standardDeviation: number = Math.sqrt(averageSquaredDifference);

  return { mean, standardDeviation };
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
