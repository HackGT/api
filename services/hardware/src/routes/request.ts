import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { ItemModel } from "src/models/item";
import { RequestModel } from "src/models/request";

export const requestRouter = express.Router();

requestRouter.route("/").post(
  checkAbility("create", "Request"),
  asyncHandler(async (req, res) => {
    const requestData = req.body;
    const request = await RequestModel.create(requestData);

    const item = await ItemModel.findById(requestData.item);

    if (!item) {
      throw new BadRequestError("Item does not exist");
    }

    item.totalAvailable -= requestData.quantity;
    item.requests.push(request._id.toString());
    item.save();

    res.send(request);
  })
);

requestRouter.route("/").get(
  checkAbility("read", "Request"),
  asyncHandler(async (req, res) => {
    const requests = await RequestModel.find().populate({
      path: "item",
      populate: { path: "location", model: "Location" },
    });

    res.send(requests);
  })
);

requestRouter.route("/:id").get(
  checkAbility("read", "Request"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const requests = await RequestModel.find({ userId: id }).populate({
      path: "item",
      populate: { path: "location", model: "Location" },
    });

    res.send(requests);
  })
);
