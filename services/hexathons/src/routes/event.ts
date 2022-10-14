import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { EventModel, Event } from "../models/event";

export const eventRoutes = express.Router();

eventRoutes.route("/").get(
  checkAbility("read", "Event"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Event> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const events = await EventModel.accessibleBy(req.ability).find(filter);

    return res.send(events);
  })
);

eventRoutes.route("/").post(
  checkAbility("create", "Event"),
  asyncHandler(async (req, res) => {
    const existingEvent = await EventModel.findOne({
      hexathon: req.body.hexathon,
      name: req.body.name,
    });

    if (existingEvent) {
      throw new BadRequestError("Event already exists for this hexathon");
    }

    const event: Event = await EventModel.create({
      hexathon: req.body.hexathon,
      name: req.body.name,
      type: req.body.type,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      tags: req.body.tags,
    });

    return res.send(event);
  })
);

eventRoutes.route("/:id").put(
  checkAbility("update", "Event"),
  asyncHandler(async (req, res) => {
    const currentEvent = await EventModel.findById(req.params.id);
    const existingEvent = await EventModel.findOne({
      hexathon: currentEvent?.hexathon,
      name: req.body.name,
    });

    if (existingEvent?.id !== req.params.id) {
      throw new BadRequestError(
        `Event with name ${req.body.name} already exists for this hexathon`
      );
    }

    const event = await EventModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          type: req.body.type,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          location: req.body.location,
          tags: req.body.tags,
        },
      },
      { new: true }
    );

    res.send(event);
  })
);

eventRoutes.route("/:id").delete(
  checkAbility("delete", "Event"),
  asyncHandler(async (req, res) => {
    await EventModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
