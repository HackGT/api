import express from "express";
import { Service } from "@api/config";
import { apiCall, asyncHandler, BadRequestError } from "@api/common";

import { prisma } from "../common";
import { AccessLevel } from "@api/prisma/generated";

export const userRoutes = express.Router();

userRoutes.route("/check").get(
  asyncHandler(async (req, res) => {
    let user = await prisma.user.findUnique({
      where: {
        email: req.user?.email,
      },
    });

    if (!req.user?.uid || !req.user?.email) {
      throw new BadRequestError("Invalid user uid or email");
    }

    if (user) {
      res.send(user);
    } else {
      const response = await apiCall(
        Service.USERS,
        {
          url: `/users/${req.user?.uid}`,
          method: "GET",
        },
        req
      );
      console.log(response);

      user = await prisma.user.create({
        data: {
          name: `${response.name.first} ${response.name.last}`,
          userId: req.user.uid,
          email: req.user.email,
          accessLevel: AccessLevel.MEMBER,
        },
      });

      res.send(user);
    }
  })
);
