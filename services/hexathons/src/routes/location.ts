import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { LocationModel, Location } from "../models/location";

export const locationRoutes = express.Router();

locationRoutes.route("/").get(
  checkAbility("read", "Location"),
  asyncHandler(async (req, res) => {
    const locations = await LocationModel.accessibleBy(req.ability);

    return res.send(locations);
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

    if (existingLocation) {
      throw new BadRequestError(`Location with name ${  req.body.name  } already exists`);
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
    await LocationModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
