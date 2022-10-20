import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { InteractionModel, Interaction, InteractionType } from "../models/interaction";

export const interactionRoutes = express.Router();

interactionRoutes.route("/").get(
  checkAbility("read", "Interaction"),
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

    const interactions = await InteractionModel.accessibleBy(req.ability).find(filter);

    return res.send(interactions);
  })
);

interactionRoutes.route("/").post(
  checkAbility("create", "Interaction"),
  asyncHandler(async (req, res) => {
    if (!req.body.type) {
      throw new BadRequestError("Type is required for an interaction");
    }

    // For event or scavenger hunt interactions, the identifier is required and must be unique
    if ([InteractionType.EVENT, InteractionType.SCAVENGER_HUNT].includes(req.body.type)) {
      const existingInteraction = await InteractionModel.findOne({
        userId: req.body.userId,
        identifier: req.body.identifier,
      });

      if (existingInteraction) {
        throw new BadRequestError("Interaction already exists for this user and identifier");
      }
    }

    const interaction = await InteractionModel.create({
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
  checkAbility("update", "Interaction"),
  asyncHandler(async (req, res) => {
    const interaction = await InteractionModel.findByIdAndUpdate(
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
  checkAbility("aggregate", "Interaction"),
  asyncHandler(async (req, res) => {
    const interactions = await InteractionModel.accessibleBy(req.ability).find({
      hexathon: req.query.hexathon,
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
            interactionsSummary[interaction.identifier].count += 1;

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
