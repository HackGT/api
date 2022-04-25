import { asyncHandler } from "@api/common";
import express from "express";

import { CheckinModel } from "../models/checkin";

export const checkinRouter = express.Router();

checkinRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const checkins = await CheckinModel.find({});

    return res.json(checkins);
  })
);

checkinRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const newCheckin = await CheckinModel.create({
      userId: req.body.userId,
      hexathon: req.body.hexathon,
      status: req.body.status,
    });

    return res.json(newCheckin);
  })
);

checkinRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const checkin = await CheckinModel.findById(req.params.id);

    return res.json(checkin);
  })
);

checkinRouter.route("/:id").patch(
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
