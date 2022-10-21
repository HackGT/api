import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { ItemModel } from "../models/item";
import { LocationModel } from "../models/location";

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
    const items = await ItemModel.find();

    res.send([...new Set(items.map(item => item.location))]);
  })
);

locationRouter.route("/").put(
  checkAbility("create", "Location"),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const location = await LocationModel.find({ name });

    if (location) {
      res.send(location);
    }
    const newLocation = await LocationModel.create({ name });

    res.send(newLocation);
  })
);
