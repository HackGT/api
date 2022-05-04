import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { Profile, ProfileModel } from "../models/profile";

export const userRoutes = express.Router();

userRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Profile> = {};
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

    if (req.query.member != null) {
      filter.permissions.member = req.query.member;
    }
    if (req.query.admin != null) {
      filter.permissions.admin = req.query.admin;
    }
    if (req.query.exec != null) {
      filter.permissions.exec = req.query.exec;
    }
    filter.$or = [
      { "name.first": { $regex: re } },
      { "name.middle": { $regex: re } },
      { "name.last": { $regex: re } },
      { phoneNumber: { $regex: re } },
    ];

    const matchCount = await ProfileModel.find(filter).count();

    const profiles = await ProfileModel.find(filter).skip(offset).limit(limit);

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
      userId: req.user?.uid,
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

    res.send(profile || {});
  })
);

userRoutes.route("/:userId").put(
  asyncHandler(async (req, res) => {
    if (req.body.permissions) {
      const profile = await ProfileModel.findOne({
        userId: req.user?.uid,
      });

      if (!profile || !(profile.permissions.exec || profile.permissions.admin)) {
        throw new BadRequestError("Unauthorized to modify permissions");
      }
    }

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
      throw new BadRequestError("Must provide at least one userId to retrieve");
    }

    const profiles = await ProfileModel.find({
      userId: userIds,
    });

    return res.status(200).json(profiles);
  })
);
