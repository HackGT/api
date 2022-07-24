import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { CheckinModel } from "../models/checkin";

export const checkinRouter = express.Router();

checkinRouter.route("/").get(
  checkAbility("read", "Checkin"),
  asyncHandler(async (req, res) => {
    const checkins = await CheckinModel.accessibleBy(req.ability).find();

    return res.json(checkins);
  })
);

checkinRouter.route("/:id").get(
  checkAbility("read", "Checkin"),
  asyncHandler(async (req, res) => {
    const checkin = await CheckinModel.findById(req.params.id).accessibleBy(req.ability);

    return res.json(checkin);
  })
);

checkinRouter.route("/").post(
  checkAbility("create", "Checkin"),
  asyncHandler(async (req, res) => {
    const newCheckin = await CheckinModel.create({
      userId: req.body.userId,
      hexathon: req.body.hexathon,
      status: req.body.status,
    });

    return res.json(newCheckin);
  })
);

checkinRouter.route("/:id").patch(
  checkAbility("update", "Checkin"),
  asyncHandler(async (req, res) => {
    const checkin = await CheckinModel.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      { new: true }
    );

    return res.json(checkin);
  })
);
