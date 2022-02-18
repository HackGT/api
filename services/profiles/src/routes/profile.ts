import { asyncHandler } from "@api/common";
import express from "express";

import { ProfileModel } from "../models/profile";

export const profileRoutes = express.Router();

profileRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const profiles = await ProfileModel.find({});

    return res.send(profiles);
  })
);

profileRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.create(req.body);

    return res.send(profile);
  })
);

profileRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

profileRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
