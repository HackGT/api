import { asyncHandler } from "@api/common";
import express from "express";
import { CheckinModel } from "../models/event"

export const checkinRouter = express.Router();

checkinRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const checkins = await CheckinModel.find({});

    return res.send(checkins);
  })
);

checkinRouter.route("/").post(
  asyncHandler(async (req, res) => {
    let checkin = new CheckinModel({
      userId: req.body.userId,
      eventId: req.body.eventId,
      status: req.body.status
    });

    await checkin.save();

    return res.send({ id: checkin._id });
  })
);

checkinRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

checkinRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
