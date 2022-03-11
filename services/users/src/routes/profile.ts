/* eslint-disable object-shorthand */
import { asyncHandler } from "@api/common";
import express from "express";
import RE2 from "re2";

import { ProfileModel } from "../models/profile";

export const profileRoutes = express.Router({ mergeParams: true });

profileRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string);
    const offset = parseInt(req.query.offset as string);
    const regex = (req.query.regex as string) === "true";
    const searchLength = (req.query.search as string).length;
    let search =
      searchLength > 75 ? (req.query.search as string).slice(0, 75) : (req.query.search as string);
    let re;

    if (regex) {
      search = search.split(/\s+/).join("");
      re = new RE2(search);
    } else {
      re = new RE2(search, "i");
    }

    const matchCount = await ProfileModel.find({
      $or: [
        { "name.first": { $regex: re } },
        { "name.middle": { $regex: re } },
        { "name.last": { $regex: re } },
        { phoneNumber: { $regex: re } },
      ],
    }).count();

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

profileRoutes.route("/").post(
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
