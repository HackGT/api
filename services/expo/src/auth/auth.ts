import express from "express";
import { ForbiddenError } from "@api/common";

import { prisma } from "../common";
import { UserRole } from "@api/prisma/generated";

export const isAdmin = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  const user = await prisma.user.findUnique({
    where: {
      userId: request.user?.uid,
    },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    throw new ForbiddenError("Sorry, you don't have access to this endpoint.");
  }

  next();
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

  if (!user || !(user.role === UserRole.ADMIN || user.isJudging)) {
    throw new ForbiddenError("Sorry, you don't have access to this endpoint.");
  }

  next();
};
