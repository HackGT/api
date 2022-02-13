import { asyncHandler } from "@api/common";
import express from "express";
import { EventModel } from "../models/event";

export const eventRouter = express.Router();

/**
 * Returns a list of all events (models)
 */
eventRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const events = await EventModel.find();
    // Get all the events (probably from Mongoose?)

    res.status(200).send(events);
  })
);

/**
 * Creates a new event (model) based on the POST body data
 */
eventRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const { name, isActive } = req.body;

    if (!req.body.name) {
      res.status(400);
      throw new Error("Please add a name field");
    }

    const createdEvent = await EventModel.create({
      name,
      isActive,
    });

    res.status(200).send(createdEvent);
  })
);

eventRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

eventRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
