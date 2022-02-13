import { asyncHandler } from "@api/common";
import express from "express";
import { createNew, Checkin, CheckinModel } from "../models/event"

export const checkinRouter = express.Router();

checkinRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const checkins = Array<string>();
    const users = await CheckinModel.find({});
    users.forEach((user) => { checkins.push(user.status) })

    return res.send(checkins);
  })
);

checkinRouter.route("/").post(
  asyncHandler(async (req, res) => {
    let checkin = createNew<Checkin>(CheckinModel, {
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
