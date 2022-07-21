import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { EventInteraction, Interaction } from "../models/interaction";

export const interactionRoutes = express.Router();

interactionRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Interaction> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }
    if (req.query.userId) {
      filter.userId = String(req.query.userId);
    }
    if (req.query.identifier) {
      filter.identifier = String(req.query.identifier);
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
      hexathon: req.body.hexathon,
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

interactionRoutes.route("/statistics").get(
  asyncHandler(async (req, res) => {
    const interactions = await EventInteraction.find({
      hexathon: String(req.query.hexathon),
    });

    const interactionsSummary: any = {};

    if (interactions.length !== 0) {
      interactions.forEach((interaction: Interaction) => {
        if (interaction.identifier != null) {
          if (!(interaction.identifier in interactionsSummary)) {
            interactionsSummary[interaction.identifier] = {
              type: interaction.type,
              count: 1,
              firstTimestamp: interaction.timestamp,
              lastTimestamp: interaction.timestamp,
            };
          } else {
            interactionsSummary[interaction.identifier].count++;
            if (
              interaction.timestamp < interactionsSummary[interaction.identifier].firstTimestamp
            ) {
              interactionsSummary[interaction.identifier].firstTimestamp = interaction.timestamp;
            } else if (
              interaction.timestamp > interactionsSummary[interaction.identifier].lastTimestamp
            ) {
              interactionsSummary[interaction.identifier].lastTimestamp = interaction.timestamp;
            }
          }
        }
      });
    }

    return res.send(interactionsSummary);
  })
);
