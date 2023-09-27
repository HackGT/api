import express from "express";
import { asyncHandler, BadRequestError } from "@api/common";

import { prisma } from "../common";

export const userRoutes = express.Router();

userRoutes.route("/check").get(
  asyncHandler(async (req, res) => {
    if (!req.user?.uid || !req.user?.email) {
      throw new BadRequestError("Invalid user uid or email");
    }

    let user = await prisma.user.findUnique({
      where: {
        userId: req.user.uid,
      },
    });

    // If user doesn't exist, create it in the hardware database
    if (!user) {
      user = await prisma.user.create({
        data: {
          userId: req.user.uid,
        },
      });
    }

    res.status(200).send({
      ...user,
      roles: req.user.roles,
    });
  })
);
