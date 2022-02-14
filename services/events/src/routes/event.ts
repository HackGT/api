import { asyncHandler } from "@api/common";
import express from "express";
import { EventModel } from "../models/event";

export const eventRouter = express.Router();

eventRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const events = await EventModel.find();
    res.status(200).send(events);
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
