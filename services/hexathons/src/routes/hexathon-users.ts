import express from "express";
import {
  apiCall,
  asyncHandler,
  BadRequestError,
  checkAbility,
  commonDefinitions,
} from "@api/common";
import _ from "lodash";
import { Service } from "@api/config";
import { FilterQuery, isValidObjectId, Types } from "mongoose";

import { CommitmentType, HexathonUser, HexathonUserModel } from "../models/hexathonUser";
import { getHexathonUserWithUpdatedPoints } from "../common/util";
import { SwagItemModel } from "../models/swagItem";

export const hexathonUserRouter = express.Router();

hexathonUserRouter.route("/:hexathonId/users").get(
  checkAbility("read", "HexathonUser"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<HexathonUser> = {
      hexathon: req.params.hexathonId,
    };

    if (req.query.matched) {
      filter["profile.matched"] = req.query.matched === "true";
    }
    if (req.query.skills?.length) {
      filter["profile.skills"] = { $in: req.query.skills };
    }
    if (req.query.school?.length) {
      filter["profile.school"] = req.query.school;
    }
    if (req.query.commitmentLevel?.length) {
      filter["profile.commitmentLevel"] = req.query.commitmentLevel;
    }

    if (req.query.search) {
      const searchLength = (req.query.search as string).length;
      const search =
        searchLength > 75
          ? (req.query.search as string).slice(0, 75)
          : (req.query.search as string);
      filter.$or = [
        { _id: isValidObjectId(search) ? new Types.ObjectId(search) : undefined },
        { userId: { $regex: new RegExp(search, "i") } },
        { email: { $regex: new RegExp(search, "i") } },
        { name: { $regex: new RegExp(search, "i") } },
        { "profile.description": { $regex: new RegExp(search, "i") } },
      ];
    }

    const matchCount = await HexathonUserModel.accessibleBy(req.ability).find(filter).count();

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const hexathonUsers = await HexathonUserModel.accessibleBy(req.ability)
      .find(filter)
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      offset,
      total: matchCount,
      count: hexathonUsers.length,
      hexathonUsers,
    });
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId").get(
  checkAbility("read", "HexathonUser"),
  asyncHandler(async (req, res) => {
    const updatedHexathonUser = await getHexathonUserWithUpdatedPoints(
      req,
      req.params.userId,
      req.params.hexathonId
    );

    return res.send(updatedHexathonUser);
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId").patch(
  checkAbility("update", "HexathonUser"),
  asyncHandler(async (req, res) => {
    // Only allow updating certain fields
    const hexathonUser = await HexathonUserModel.findOneAndUpdate(
      { userId: req.params.userId, hexathon: req.params.hexathonId },
      _.pick(req.body, ["address", "validAddress", "trackingLabel"]),
      {
        new: true,
      }
    );

    return res.send(hexathonUser);
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId/profile").patch(
  checkAbility("manage", "HexathonUser"),
  asyncHandler(async (req, res) => {
    if (req.body.skills) {
      if (!Array.isArray(req.body.skills)) {
        throw new BadRequestError("Skills is not an array of strings");
      }
      const skills = req.body.skills as string[];
      // check if all provided skills are valid
      const invalidSkills = skills.filter(skill => !commonDefinitions.skills.enum.includes(skill));
      if (invalidSkills.length > 0) {
        throw new BadRequestError(`Invalid skills provided: ${invalidSkills.join(", ")}`);
      }
    }

    if (
      req.body.commitmentLevel &&
      !Object.values(CommitmentType).includes(req.body.commitmentLevel)
    ) {
      throw new BadRequestError("Invalid commitment level provided");
    }

    const hexathonUser = await HexathonUserModel.findOneAndUpdate(
      { userId: req.params.userId, hexathon: req.params.hexathonId },
      {
        $set: {
          "profile.matched": req.body.matched,
          "profile.school": req.body.school,
          "profile.year": req.body.year,
          "profile.major": req.body.major,
          "profile.description": req.body.description,
          "profile.commitmentLevel": req.body.commitmentLevel,
          "profile.skills": req.body.skills,
          "profile.isJudging": req.body.isJudging,
        },
      },
      {
        new: true,
      }
    );
    return res.send(hexathonUser);
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId/actions/check-valid-user").post(
  checkAbility("read", "HexathonUser"),
  asyncHandler(async (req, res) => {
    let hexathonUser = await HexathonUserModel.accessibleBy(req.ability).findOne({
      userId: req.params.userId,
      hexathon: req.params.hexathonId,
    });

    if (hexathonUser) {
      return res.sendStatus(200);
    }

    // Check again if hexathonUser exists but user doesn't have permission
    hexathonUser = await HexathonUserModel.findOne({
      userId: req.params.userId,
      hexathon: req.params.hexathonId,
    });
    if (hexathonUser) {
      throw new BadRequestError("You do not have access or invalid params provided.");
    }

    const applications = await apiCall(
      Service.REGISTRATION,
      {
        method: "GET",
        url: "/applications",
        params: {
          hexathon: req.params.hexathonId,
          userId: req.params.userId,
          requireApplicationData: true,
        },
      },
      req
    );

    if (applications?.applications.length < 1) {
      throw new BadRequestError("User is not registered for this hexathon.");
    }

    // Check if user's email is not already registered for this hexathon
    hexathonUser = await HexathonUserModel.findOne({
      email: applications.applications[0].email,
      hexathon: req.params.hexathonId,
    });
    if (hexathonUser) {
      throw new BadRequestError("User's email is already registered for this hexathon.");
    }

    await HexathonUserModel.create({
      userId: req.params.userId,
      hexathon: req.params.hexathonId,
      email: applications.applications[0].email,
      name: applications.applications[0].name,
      profile: {
        school: applications.applications[0].applicationData.school,
        year: applications.applications[0].applicationData.schoolYear,
        major: applications.applications[0].applicationData.major,
        matched: applications.applications[0].applicationData.matched,
      },
    });

    return res.sendStatus(200);
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId/actions/purchase-swag-item").post(
  checkAbility("manage", "HexathonUser"),
  asyncHandler(async (req, res) => {
    const { swagItemId } = req.body;
    const quantity = parseInt(req.body.quantity);

    const hexathonUser = await getHexathonUserWithUpdatedPoints(
      req,
      req.params.userId,
      req.params.hexathonId
    );

    const swagItem = await SwagItemModel.findOne({
      hexathon: req.params.hexathonId,
      _id: swagItemId,
    });

    if (!swagItem) {
      throw new BadRequestError("Invalid swag item id provided.");
    }

    if (swagItem.purchased + quantity > swagItem.capacity) {
      throw new BadRequestError("Swag item is full.");
    }

    if (swagItem.points * quantity > hexathonUser.points.currentTotal) {
      throw new BadRequestError("User does not have enough points to purchase this swag item.");
    }

    await HexathonUserModel.findOneAndUpdate(
      {
        userId: req.params.userId,
        hexathon: req.params.hexathonId,
      },
      {
        "points.numSpent": hexathonUser.points.numSpent + swagItem.points * quantity,
        "$push": {
          purchasedSwagItems: {
            swagItemId,
            quantity,
            timestamp: new Date(),
          },
        },
      },
      {
        new: true,
      }
    );

    await SwagItemModel.findByIdAndUpdate(swagItem.id, {
      purchased: (swagItem.purchased || 0) + quantity,
    });

    return res.sendStatus(204);
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId/actions/update-points").post(
  checkAbility("manage", "HexathonUser"),
  asyncHandler(async (req, res) => {
    const { numSpent, numAdditional } = req.body;

    if (!req.user?.roles?.member) {
      throw new BadRequestError("You do not have permission to update points.");
    }

    const hexathonUser = await HexathonUserModel.findOneAndUpdate(
      { userId: req.params.userId, hexathon: req.params.hexathonId },
      {
        "points.numSpent": numSpent,
        "points.numAdditional": numAdditional,
        "points.lastUpdated": new Date(),
      },
      {
        new: true,
      }
    );

    return res.send(hexathonUser);
  })
);

// const usps = new USPS({
//   server: "https://secure.shippingapis.com/ShippingAPI.dll",
//   userId: "urbad", //process.env.USPS_ACCOUNT_USERNAME,
//   ttl: 10000,
// });
//
// userRoutes.route("/validateAddress").post(async (req, res) => {
//   usps.verify(req.body, (error: any, response: any) => {
//     if (!error) {
//       const { dpv_confirmation, street1, street2, city, state, zip, zip4 } = response;
//       res.status(200).json({
//         candidate: [`${street1} ${street2}`.trim(), `${city} ${state} ${zip}-${zip4}`],
//         primaryConfirmed: dpv_confirmation !== "N",
//         secondaryConfirmed: dpv_confirmation === "Y",
//         secondaryNeeded: dpv_confirmation === "D",
//       });
//     } else {
//       res.status(500).json({
//         error: true,
//         mesage: error.message,
//       });
//     }
//   });
// });
