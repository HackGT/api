import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { LocationModel } from "src/models/location";

export const locationRouter = express.Router();

locationRouter.route("/").post(
  checkAbility("create", "Location"),
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    const location = await LocationModel.create({ name });

    res.send(location);
  })
);

locationRouter.route("/").get(
  checkAbility("create", "Location"),
  asyncHandler(async (req, res) => {
    const locations = await LocationModel.find();

    res.send(locations);
  })
);
