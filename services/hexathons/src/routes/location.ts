import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { EventModel } from "../models/event";
import { LocationModel } from "../models/location";

export const locationRoutes = express.Router();

locationRoutes.route("/").get(
  checkAbility("read", "Location"),
  asyncHandler(async (req, res) => {
    const locations = await LocationModel.accessibleBy(req.ability);

    return res.send(locations);
  })
);

locationRoutes.route("/:id").get(
  checkAbility("read", "Location"),
  asyncHandler(async (req, res) => {
    const location = await LocationModel.findById(req.params.id).accessibleBy(req.ability);
    return res.send(location);
  })
);

locationRoutes.route("/").post(
  checkAbility("create", "Location"),
  asyncHandler(async (req, res) => {
    const existingLocation = await LocationModel.findOne({
      name: req.body.name,
    });

    if (existingLocation) {
      throw new BadRequestError("Location already exists");
    }

    const location = await LocationModel.create({
      name: req.body.name,
    });

    return res.send(location);
  })
);

locationRoutes.route("/:id").put(
  checkAbility("update", "Location"),
  asyncHandler(async (req, res) => {
    const existingLocation = await LocationModel.findOne({
      name: req.body.name,
    });

    if (existingLocation && existingLocation.id !== req.params.id) {
      throw new BadRequestError(`Location with name ${req.body.name} already exists`);
    }

    const location = await LocationModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
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
    const event = await EventModel.findOne({
      location: req.params.id,
    });
    if (event) {
      throw new BadRequestError("Event with location still exists. Location cannot be deleted.");
    }
    await LocationModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
