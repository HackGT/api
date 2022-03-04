import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { EventInteraction, Interaction } from "../models/interaction";

export const interactionRoutes = express.Router();

interactionRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Interaction> = {};

    if (req.query.event) {
      filter.event = String(req.query.event);
    }

    if (req.query.userId) {
      filter.userId = String(req.query.userId);
    }

    const interactions = await EventInteraction.find(filter);

    return res.send(interactions);
  })
);

interactionRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const existingInteraction = await EventInteraction.findOne({
      uuid: req.body.uuid,
      userId: req.body.userId,
    });

    if (existingInteraction) {
      throw new BadRequestError("Interaction already exists for this user and event");
    }

    const interaction = await EventInteraction.create({
      uuid: req.body.uuid,
      userId: req.body.userId,
      timeIn: new Date(),
      event: req.body.event,
    });

    return res.send(interaction);
  })
);

interactionRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    const interaction = await EventInteraction.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          uuid: req.params.uuid,
          userId: req.params.userId,
          timeIn: new Date().toLocaleString(),
        },
      },
      { new: true }
    );

    res.send(interaction);
  })
);
