/* eslint-disable object-shorthand */
import { asyncHandler } from "@api/common";
import express from "express";

import { ProfileModel } from "../models/profile";

export const profileRoutes = express.Router({ mergeParams: true });

profileRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string);
    const offset = parseInt(req.query.offset as string);
    const regex = (req.query.regex as string) === "true";

    let re;
    if (regex) {
      const search = (req.query.search as string).split(/\s+/).join("");
      re = new RegExp(search, "i");
    } else {
      re = new RegExp(req.query.search as string);
    }

    const matchCount = await ProfileModel.find({
      $or: [
        { "name.first": { $regex: re } },
        { "name.middle": { $regex: re } },
        { "name.last": { $regex: re } },
        { phoneNumber: { $regex: re } },
      ],
    }).count();
    console.log(matchCount);
    const profiles = await ProfileModel.find({
      $or: [
        { "name.first": { $regex: re } },
        { "name.middle": { $regex: re } },
        { "name.last": { $regex: re } },
        { phoneNumber: { $regex: re } },
      ],
    })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      offset: offset + profiles.length,
      total: matchCount,
      count: profiles.length,
      profiles: profiles,
    });
  })
);

profileRoutes.route("/:userId").post(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.create({
      ...req.body,
      user: req.params.userId,
    });

    return res.send(profile);
  })
);

profileRoutes.route("/").put(
  asyncHandler(async (req, res) => {
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { user: req.params.userId },
      req.body,
      {
        new: true,
      }
    );

    res.send(updatedProfile);
  })
);
