import express from "express";
import { asyncHandler, checkAbility } from "@api/common";
import { FilterQuery } from "mongoose";

import { SwagItem, SwagItemModel } from "../models/swagItem";

export const swagItemRouter = express.Router();

swagItemRouter.route("/").get(
  checkAbility("read", "SwagItem"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<SwagItem> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const swagItems = await SwagItemModel.accessibleBy(req.ability).find(filter);
    return res.send(swagItems);
  })
);

swagItemRouter.route("/:swagItemId").get(
  checkAbility("read", "SwagItem"),
  asyncHandler(async (req, res) => {
    const swagItem = await SwagItemModel.findById(req.params.swagItemId).accessibleBy(req.ability);

    return res.send(swagItem);
  })
);

swagItemRouter.route("/").post(
  checkAbility("create", "SwagItem"),
  asyncHandler(async (req, res) => {
    const swagItem = await SwagItemModel.create(req.body);

    return res.send(swagItem);
  })
);

swagItemRouter.route("/:swagItemId").put(
  checkAbility("update", "SwagItem"),
  asyncHandler(async (req, res) => {
    const swagItem = await SwagItemModel.accessibleBy(req.ability).findByIdAndUpdate(
      req.params.swagItemId,
      req.body,
      {
        new: true,
      }
    );
    return res.send(swagItem);
  })
);

swagItemRouter.route("/:swagItemId").delete(
  checkAbility("delete", "SwagItem"),
  asyncHandler(async (req, res) => {
    await SwagItemModel.accessibleBy(req.ability).findByIdAndDelete(req.params.swagItemId);
    return res.sendStatus(204);
  })
);
