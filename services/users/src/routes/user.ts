import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import RE2 from "re2";

import { ProfileModel } from "../models/profile";

export const userRoutes = express.Router();

userRoutes.route("/").get(
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
      re = new RegExp(search);
    } else {
      re = new RegExp(search, "i");
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
      profiles,
    });
  })
);

userRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.create({
      ...req.body,
    });

    return res.send(profile);
  })
);

userRoutes.route("/:userId").get(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.findOne({
      user: req.params.userId,
    });

    res.send(profile || {});
  })
);

userRoutes.route("/:userId").put(
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

userRoutes.route("/actions/retrieve").post(
  asyncHandler(async (req, res) => {
    const { userIds }: { userIds: string[] } = req.body;

    if (!userIds || userIds.length === 0) {
      throw new BadRequestError("Must provide at least one userId to retrieve");
    }

    const profiles = await ProfileModel.find({
      user: userIds,
    });

    return res.status(200).json(profiles);
  })
);
