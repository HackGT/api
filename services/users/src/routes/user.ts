import { apiCall, asyncHandler } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery } from "mongoose";

import { Profile, ProfileModel } from "../models/profile";

export const userRoutes = express.Router();

userRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Profile> = {};

    if (req.query.search) {
      const searchLength = (req.query.search as string).length;
      let search =
        searchLength > 75
          ? (req.query.search as string).slice(0, 75)
          : (req.query.search as string);
      let re;

      const regex = (req.query.regex as string) === "true";

      if (regex) {
        search = search.split(/\s+/).join("");
        re = new RegExp(search);
      } else {
        re = new RegExp(search, "i");
      }
      filter.$or = [
        { "name.first": { $regex: re } },
        { "name.middle": { $regex: re } },
        { "name.last": { $regex: re } },
        { phoneNumber: { $regex: re } },
        { email: { $regex: re } },
      ];
    }

    const matchCount = await ProfileModel.find(filter).count();

    const limit = parseInt(req.query.limit as string);
    const offset = parseInt(req.query.offset as string);
    const profiles = await ProfileModel.find(filter).skip(offset).limit(limit);

    return res.status(200).json({
      offset: offset + profiles.length,
      total: matchCount,
      count: profiles.length,
      profiles,
    });
  })
);

// TODO: Change this post request to be created when
// a user is created through Google Cloud Functions
userRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.create({
      userId: req.user?.uid,
      email: req.user?.email,
      name: {
        first: req.body.name.first,
        middle: req.body.name.middle,
        last: req.body.name.last,
      },
      phoneNumber: req.body.phoneNumber,
      gender: req.body.gender,
      resume: req.body.resume,
    });

    return res.send(profile);
  })
);

userRoutes.route("/:userId").get(
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.findOne({
      userId: req.params.userId,
    });

    const permission = await apiCall(
      Service.AUTH,
      { method: "GET", url: `/permissions/${req.params.userId}` },
      req
    );

    const combinedProfile = {
      ...profile?.toObject(),
      ...permission,
    };

    res.send(combinedProfile || {});
  })
);

userRoutes.route("/:userId").put(
  asyncHandler(async (req, res) => {
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.params.userId },
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
      return res.status(200).json([]);
    }

    const profiles = await ProfileModel.find({
      userId: userIds,
    });

    return res.status(200).json(profiles);
  })
);
