import { asyncHandler } from "@api/common";
import express from "express";

import { ProfileModel } from "../models/profile";

export const profileRoutes = express.Router({ mergeParams: true });

profileRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.findOne({
      user: req.params.userId,
    });

    res.send(profile || {});
  })
);

profileRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.create({
      ...req.body,
      user: req.params.userId,
    });

    return res.send(profile);
  })
);

profileRoutes.route("/").put(
  asyncHandler(async (req, res) => {
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { user: req.params.userId },
      req.body,
      {
        new: true,
      }
    );

    res.send(updatedProfile);
  })
);
