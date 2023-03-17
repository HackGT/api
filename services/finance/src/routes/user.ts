import express from "express";
import { Service } from "@api/config";
import { apiCall, asyncHandler, BadRequestError } from "@api/common";

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
          userId: req.user.uid,
          email: req.user.email,
          name: `${response.name.first} ${response.name.last}`,
        },
      });

      res.send(user);
    }
  })
);
