import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { LocationModel, Location } from "../models/location";

export const locationRoutes = express.Router();

locationRoutes.route("/").get(
  checkAbility("read", "Location"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Location> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const locations = await LocationModel.accessibleBy(req.ability).find(filter);

    return res.send(locations);
  })
);

locationRoutes.route("/").post(
  checkAbility("create", "Location"),
  asyncHandler(async (req, res) => {
    const existingLocation = await LocationModel.findOne({
      hexathon: req.body.hexathon,
      name: req.body.name,
    });

    if (existingLocation) {
      throw new BadRequestError("Location already exists for this hexathon");
    }

    const location = await LocationModel.create({
      hexathon: req.body.hexathon,
      name: req.body.name,
    });

    return res.send(location);
  })
);

locationRoutes.route("/:id").put(
  checkAbility("update", "Location"),
  asyncHandler(async (req, res) => {
    const location = await LocationModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          refs: req.body.refs,
        },
      },
      { new: true }
    );

    res.send(location);
  })
);

locationRoutes.route("/:id").delete(
  checkAbility("delete", "Location"),
  asyncHandler(async (req, res) => {
    await LocationModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
