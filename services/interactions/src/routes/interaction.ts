import { asyncHandler, BadRequestError, checkApiKey } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { EventInteraction, Interaction } from "../models/interaction";

export const interactionRoutes = express.Router();

interactionRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Interaction> = {};

    if (req.query.hackathon) {
      filter.event = String(req.query.hackathon);
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
      userId: req.body.userId,
      identifier: req.body.identifier,
    });

    if (existingInteraction) {
      throw new BadRequestError("Interaction already exists for this user and identifier");
    }

    const interaction = await EventInteraction.create({
      ...(req.body.identifier && { identifier: req.body.identifier }),
      userId: req.body.userId,
      type: req.body.type,
      timestamp: new Date(),
      hackathon: req.body.hackathon,
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
          userId: req.params.userId,
          identifier: req.body.identifier,
          timestamp: new Date(),
        },
      },
      { new: true }
    );

    res.send(interaction);
  })
);
