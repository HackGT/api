import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { ItemModel } from "../models/item";
import { HardwareRequestModel } from "../models/hardware-request";

export const hardwareRequestRouter = express.Router();

hardwareRequestRouter.route("/").post(
  checkAbility("create", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    const hardwareRequestData = req.body;
    const hardwareRequest = await HardwareRequestModel.create(hardwareRequestData);

    const item = await ItemModel.findById(hardwareRequestData.item);

    if (!item) {
      throw new BadRequestError("Item does not exist");
    }

    item.totalAvailable -= hardwareRequestData.quantity;
    item.requests.push(hardwareRequest._id.toString());
    item.save();

    res.send(hardwareRequest);
  })
);

hardwareRequestRouter.route("/").get(
  checkAbility("read", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    const hardwareRequests = await HardwareRequestModel.find().populate({
      path: "item",
    });

    res.send(hardwareRequests);
  })
);

hardwareRequestRouter.route("/:id").get(
  checkAbility("read", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hardwareRequests = await HardwareRequestModel.findById(id);

    res.send(hardwareRequests);
  })
);

hardwareRequestRouter.route("/:id").delete(
  checkAbility("create", "HardwareRequest"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hardwareRequest = await HardwareRequestModel.findById(id);
    if (!hardwareRequest) {
      throw new BadRequestError("Hardware request not found");
    }

    console.log(hardwareRequest.quantity);

    const item = await ItemModel.findByIdAndUpdate(hardwareRequest.item, {
      $inc: { totalAvailable: hardwareRequest.quantity },
      $pull: {
        requests: hardwareRequest.id,
      },
    });

    await hardwareRequest.delete();

    res.send(hardwareRequest);
  })
);
