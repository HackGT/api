import express from "express";
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import _ from "lodash";
import { Service } from "@api/config";

import { HexathonUserModel } from "../models/hexathonUser";
import { getHexathonUserWithUpdatedPoints } from "../common/util";
import { PrizeItemModel } from "../models/prizeItem";

export const hexathonUserRouter = express.Router();

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
        },
      },
      req
    );

    if (applications?.applications.length < 1) {
      throw new BadRequestError("User is not registered for this hexathon.");
    }
    if (applications.applications[0].status !== "CONFIRMED") {
      throw new BadRequestError("User is not confirmed for this hexathon.");
    }

    await HexathonUserModel.create({
      userId: req.params.userId,
      hexathon: req.params.hexathonId,
      email: applications.applications[0].email,
      name: applications.applications[0].name,
    });

    return res.sendStatus(200);
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId/actions/purchase-prize-item").post(
  checkAbility("manage", "HexathonUser"),
  asyncHandler(async (req, res) => {
    const { prizeItemId, quantity } = req.body;

    const hexathonUser = await getHexathonUserWithUpdatedPoints(
      req,
      req.params.userId,
      req.params.hexathonId
    );

    const prizeItem = await PrizeItemModel.findOne({
      hexathon: req.params.hexathonId,
      id: prizeItemId,
    });

    if (!prizeItem) {
      throw new BadRequestError("Invalid prize item id provided.");
    }

    if (prizeItem.totalNumRequested + quantity > prizeItem.capacity) {
      throw new BadRequestError("Prize item is full.");
    }

    if (prizeItem.points * quantity > hexathonUser.points.currentTotal) {
      throw new BadRequestError("User does not have enough points to purchase this prize item.");
    }

    await HexathonUserModel.findOneAndUpdate(
      {
        userId: req.params.userId,
        hexathon: req.params.hexathonId,
      },
      {
        points: {
          numSpent: hexathonUser.points.numSpent - prizeItem.points * quantity,
        },
        $push: {
          purchasedPrizeItems: {
            prizeItemId,
            quantity,
            timestamp: new Date(),
          },
        },
      },
      {
        new: true,
      }
    );

    return res.sendStatus(204);
  })
);

hexathonUserRouter.route("/:hexathonId/users/:userId/actions/update-points").post(
  checkAbility("manage", "HexathonUser"),
  asyncHandler(async (req, res) => {
    const { numSpent, numAdditional } = req.body;

    const hexathonUser = await HexathonUserModel.findOneAndUpdate(
      { userId: req.params.userId, hexathon: req.params.hexathonId },
      {
        points: {
          numSpent,
          numAdditional,
          lastUpdated: new Date(),
        },
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
