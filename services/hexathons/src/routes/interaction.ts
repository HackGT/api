import { asyncHandler, BadRequestError, checkAbility, ConfigError, apiCall } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery } from "mongoose";

import { EventModel } from "../models/event";
import { InteractionModel, Interaction, InteractionType } from "../models/interaction";
import { EVENT_TYPE_POINTS } from "../common/util";

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
    if (req.query.type) {
      filter.type = String(req.query.type);
    }

    const interactions = await InteractionModel.accessibleBy(req.ability)
      .find(filter)
      .populate("event");

    return res.send(interactions);
  })
);

interactionRoutes.route("/").post(
  checkAbility("create", "Interaction"),
  asyncHandler(async (req, res) => {
    if (!req.body.type) {
      throw new BadRequestError("Type is required for an interaction");
    }

    if (!req.user?.roles.member && req.body.type === InteractionType.EVENT) {
      throw new BadRequestError("Only members can create event interactions");
    }

    if (!req.user?.roles.member && req.body.type === InteractionType.CHECK_IN) {
      throw new BadRequestError("Only members can create check-in interactions");
    }

    // For event or scavenger hunt interactions, the identifier is required and must be unique
    if ([InteractionType.EVENT, InteractionType.SCAVENGER_HUNT].includes(req.body.type)) {
      const existingInteraction = await InteractionModel.findOne({
        userId: req.body.userId,
        type: req.body.type,
        identifier: req.body.identifier,
        hexathon: req.body.hexathon,
      });

      if (existingInteraction) {
        throw new BadRequestError("Interaction already exists for this user and identifier");
      }
    } else if (
      // For these types, no identifier is required, but don't duplicate interactions
      [InteractionType.CHECK_IN, InteractionType.EXPO_SUBMISSION].includes(req.body.type)
    ) {
      const existingInteraction = await InteractionModel.findOne({
        userId: req.body.userId,
        type: req.body.identifier,
        hexathon: req.body.hexathon,
      });

      if (existingInteraction) {
        return res.send(existingInteraction);
      }
    } else {
      throw new ConfigError(
        "Interaction type must be setup on the backend. Please contact tech team."
      );
    }

    let interaction;

    if (req.body.type === InteractionType.EVENT) {
      const event = await EventModel.findOne({
        _id: req.body.identifier,
        hexathon: req.body.hexathon,
      });

      if (!event) {
        throw new BadRequestError("No event found in this hexathon with this identifier");
      }

      interaction = await InteractionModel.create({
        identifier: req.body.identifier,
        userId: req.body.userId,
        type: req.body.type,
        timestamp: new Date(),
        hexathon: req.body.hexathon,
        event: event.id,
      });
    } else {
      interaction = await InteractionModel.create({
        ...(req.body.identifier && { identifier: req.body.identifier }),
        userId: req.body.userId,
        type: req.body.type,
        timestamp: new Date(),
        hexathon: req.body.hexathon,
      });
    }

    // If this is a check-in interaction, update the application status to CHECKED_IN
    if (req.body.type === InteractionType.CHECK_IN) {
      try {
        // Find the user's application for this hexathon
        const applicationsResponse = await apiCall(
          Service.REGISTRATION,
          {
            method: "GET",
            url: "/applications",
            params: {
              hexathon: req.body.hexathon,
              userId: req.body.userId,
            },
          },
          req
        );

        if (applicationsResponse.applications && applicationsResponse.applications.length > 0) {
          const application = applicationsResponse.applications[0];

          // Update the application status to CHECKED_IN
          await apiCall(
            Service.REGISTRATION,
            {
              method: "POST",
              url: `/applications/${application.id}/actions/update-status`,
              data: {
                status: "CHECKED_IN",
              },
            },
            req
          );
        } else {
          console.warn(
            `User ${req.body.userId} checked in but no application found for hexathon ${req.body.hexathon}`
          );
        }
      } catch (error) {
        console.error(
          "Failed to update application status for user %s check-in:",
          req.body.userId,
          error
        );
      }
    }

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

interactionRoutes
  .route("/event-type-points")
  .get(asyncHandler(async (req, res) => res.send(EVENT_TYPE_POINTS)));
