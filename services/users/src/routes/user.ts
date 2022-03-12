import { asyncHandler, checkApiKey } from "@api/common";
import express from "express";
import admin from "firebase-admin";
import RE2 from "re2";

import { ProfileModel } from "../models/profile";

export const userRoutes = express.Router();

userRoutes.use(checkApiKey);

userRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    let pageSize = parseInt(req.query.pageSize as string) || 1000;

    if (pageSize > 1000) {
      pageSize = 1000;
    } else if (pageSize < 1) {
      pageSize = 100;
    }

    const usersResult = await admin
      .auth()
      .listUsers(pageSize, req.query.pageToken as string | undefined);

    return res.status(200).json({
      pageSize: usersResult.users.length,
      pageToken: usersResult.pageToken,
      users: usersResult.users,
    });
  })
);

userRoutes.route("/:userId").get(
  asyncHandler(async (req, res) => {
    const user = await admin.auth().getUser(req.params.userId);

    return res.status(200).json(user);
  })
);

userRoutes.route("/:userId").patch(
  asyncHandler(async (req, res) => {
    const user = await admin.auth().updateUser(req.params.userId, {
      disabled: req.body.disabled ?? undefined,
    });

    return res.status(200).json(user);
  })
);

userRoutes.route("/:userId").delete(
  asyncHandler(async (req, res) => {
    await admin.auth().deleteUser(req.params.userId);

    return res.status(204).end();
  })
);

userRoutes.route("/search").post(
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
      profiles,
    });
  })
);
