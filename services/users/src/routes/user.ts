import {
  apiCall,
  asyncHandler,
  BadRequestError,
  checkAbility,
  DEFAULT_USER_ROLES,
  ForbiddenError,
  ServerError,
} from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery } from "mongoose";
import admin from "firebase-admin";

import { Profile, ProfileModel } from "../models/profile";

export const userRoutes = express.Router();

userRoutes.route("/").get(
  checkAbility("read", "Profile"),
  asyncHandler(async (req, res) => {
    if (!req.user?.roles.member) {
      throw new ForbiddenError("You do not have permission to access this resource.");
    }

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

    // Restrict user limit to 100 due to Firebase constraints
    // (https://firebase.google.com/docs/auth/admin/manage-users#bulk_retrieve_user_data)
    if (req.query.limit && parseInt(req.query.limit as string) > 100) {
      throw new BadRequestError("Limit cannot be greater than 100.");
    }

    const matchCount = await ProfileModel.accessibleBy(req.ability).find(filter).count();

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const profiles = await ProfileModel.accessibleBy(req.ability)
      .find(filter)
      .skip(offset)
      .limit(limit);

    // Get batch user permissions and firebase data in parallel
    const [allUserPermissions, firebaseUsers] = await Promise.all([
      apiCall(
        Service.AUTH,
        {
          url: "/permissions/actions/retrieve",
          method: "POST",
          data: {
            userIds: profiles.map(profile => profile.userId),
          },
        },
        req
      ),
      admin.auth().getUsers(profiles.map(profile => ({ uid: profile.userId }))),
    ]);

    const combinedProfiles = profiles.map(profile => {
      const userPermissions = allUserPermissions.find(
        (permission: any) => permission.userId === profile.userId
      );
      const firebaseUser = firebaseUsers.users.find(user => user.uid === profile.userId);
      if (!firebaseUser) {
        throw new ServerError(`No firebase user found for ${profile.userId}.`);
      }

      return {
        ...profile.toJSON(),
        ...{
          emailVerified: firebaseUser.emailVerified,
          disabled: firebaseUser.disabled,
          metadata: firebaseUser.metadata,
          tokensValidAfterTime: firebaseUser.tokensValidAfterTime,
          providerData: firebaseUser.providerData,
        },
        ...(userPermissions ?? { roles: DEFAULT_USER_ROLES }),
      };
    });

    return res.status(200).json({
      offset,
      total: matchCount,
      count: profiles.length,
      profiles: combinedProfiles,
    });
  })
);

// Public Endpoint for HexLabs tech-onboarding project
userRoutes.route("/hexlabs").get(
  asyncHandler(async (req, res) => {
    const profiles = await ProfileModel.find({
      email: { $regex: /@hexlabs.org/i },
    });

    return res.status(200).json(profiles);
  })
);

userRoutes.route("/:userId").get(
  checkAbility("read", "Profile"),
  asyncHandler(async (req, res) => {
    const profile = await ProfileModel.findOne({
      userId: req.params.userId,
    }).accessibleBy(req.ability);

    if (!profile) {
      res.send({});
      return;
    }

    const permission = await apiCall(
      Service.AUTH,
      { method: "GET", url: `/permissions/${req.params.userId}` },
      req
    );

    const combinedProfile = {
      ...profile?.toJSON(),
      ...permission,
    };

    res.send(combinedProfile || {});
  })
);

// TODO: Change this post request to be created when
// a user is created through Google Cloud Functions
userRoutes.route("/").post(
  checkAbility("create", "Profile"),
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

userRoutes.route("/:userId").put(
  checkAbility("update", "Profile"),
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
  checkAbility("read", "Profile"),
  asyncHandler(async (req, res) => {
    const { userIds }: { userIds: string[] } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(200).json([]);
    }

    const profiles = await ProfileModel.accessibleBy(req.ability).find({
      userId: userIds,
    });

    return res.status(200).json(profiles);
  })
);

userRoutes.route("/actions/retrieve-members").post(
  checkAbility("read", "Profile"),
  asyncHandler(async (req, res) => {
    if (!req.user?.roles.member) {
      throw new ForbiddenError("You do not have permission to access this resource.");
    }

    const memberPermissions = await apiCall(
      Service.AUTH,
      { method: "POST", url: "permissions/actions/retrieve-members" },
      req
    );

    const profiles = await ProfileModel.accessibleBy(req.ability).find({
      userId: memberPermissions.map((permission: any) => permission.userId),
    });

    const combinedProfiles = [];
    for (const profile of profiles) {
      const userPermissions = memberPermissions.find(
        (permission: any) => permission.userId === profile.userId
      );
      combinedProfiles.push({
        ...profile.toJSON(),
        ...(userPermissions ?? {}),
      });
    }

    return res.status(200).json(combinedProfiles);
  })
);
