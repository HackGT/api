import { apiCall, ConfigError } from "@api/common";
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
