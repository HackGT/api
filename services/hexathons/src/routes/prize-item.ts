import express from "express";
import { asyncHandler, checkAbility } from "@api/common";
import { FilterQuery } from "mongoose";

import { PrizeItem, PrizeItemModel } from "../models/prizeItem";

export const prizeItemRouter = express.Router();

prizeItemRouter.route("/").get(
  checkAbility("read", "PrizeItem"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<PrizeItem> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const prizeItems = await PrizeItemModel.accessibleBy(req.ability).find(filter);
    return res.send(prizeItems);
  })
);

prizeItemRouter.route("/:prizeItemId").get(
  checkAbility("read", "PrizeItem"),
  asyncHandler(async (req, res) => {
    const prizeItem = await PrizeItemModel.findById(req.params.prizeItemId).accessibleBy(
      req.ability
    );

    return res.send(prizeItem);
  })
);

prizeItemRouter.route("/").post(
  checkAbility("create", "PrizeItem"),
  asyncHandler(async (req, res) => {
    const prizeItem = await PrizeItemModel.create(req.body);

    return res.send(prizeItem);
  })
);

prizeItemRouter.route("/:prizeItemId").put(
  checkAbility("update", "PrizeItem"),
  asyncHandler(async (req, res) => {
    const prizeItem = await PrizeItemModel.accessibleBy(req.ability).findByIdAndUpdate(
      req.params.prizeItemId,
      req.body,
      {
        new: true,
      }
    );
    return res.send(prizeItem);
  })
);

prizeItemRouter.route("/:prizeItemId").delete(
  checkAbility("delete", "PrizeItem"),
  asyncHandler(async (req, res) => {
    await PrizeItemModel.accessibleBy(req.ability).findByIdAndDelete(req.params.prizeItemId);
    return res.sendStatus(204);
  })
);
