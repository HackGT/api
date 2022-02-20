import { asyncHandler } from "@api/common";
import express from "express";

import { EventModel } from "../models/event";

export const eventRouter = express.Router();

eventRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const events = await EventModel.find();

    return res.status(200).send(events);
  })
);

eventRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const { name, isActive } = req.body;
    if (!req.body.name) {
      res.status(400);
      throw new Error("Please add all fields");
    }

    const createdEvent = await EventModel.create({
      name,
      isActive,
    });

    return res.status(200).send(createdEvent);
  })
);

eventRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await EventModel.findById(id);
    if (!event) {
      res.status(400);
      throw new Error("Event not found");
    }
    return res.status(200).send(event);
  })
);

eventRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await EventModel.findById(id);
    if (!event) {
      res.status(400);
      throw new Error("Event not found");
    }

    const updatedEvent = await EventModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedEvent);
  })
);
