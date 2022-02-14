import { asyncHandler } from "@api/common";
import express from "express";
import { Document, model } from "mongoose";
import { ProfileModel } from "../models/profile";

export const profileRoutes = express.Router();

profileRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const profiles = await ProfileModel.find({});

    return res.send(profiles);
  })
);

profileRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    if (!req.body.first || !req.body.last) {
      return res.status(400).send({error: "Please fill in all the required fields."});
    }

    /*
      Creating a new ProfileModel based on the model imported from /models/profile.ts
      Adding the document into collection using mongoose.
      */
    let profile = new ProfileModel({
      first: req.body.first,
      middle: req.body.middle,
      last: req.body.last,
      gender: req.body.gender,
      phoneNumber: req.body.phoneNumber,
    });

    await profile.save();

    return res.send({ error: false });
  })
);

profileRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

profileRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
