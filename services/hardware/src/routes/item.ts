import { asyncHandler, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { Item, ItemModel } from "src/models/item";

export const itemRouter = express.Router();

itemRouter.route("/").get(
  checkAbility("read", "Item"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Item> = {};

    if (req.query.name) {
      filter.name = String(req.query.name);
    }

    if (req.query.location) {
      filter.location = String(req.query.location);
    }

    if (req.query.category) {
      filter.category = String(req.query.category);
    }

    if (req.query.description) {
      filter.description = String(req.query.description);
    }

    if (req.query.hidden) {
      filter.hidden = String(req.query.hidden);
    }

    const items = await ItemModel.find(filter).populate("location").populate("category");

    return res.send(items);
  })
);

itemRouter.route("/:id").get(
  checkAbility("read", "Item"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await ItemModel.findById(id);
    return res.send(item);
  })
);

itemRouter.route("/amount/:id").get(
  checkAbility("read", "Item"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await ItemModel.findById(id);

    return res.send(item ? item.totalAvailable : item);
  })
);

itemRouter.route("/").post(
  checkAbility("create", "Item"),
  asyncHandler(async (req, res) => {
    const itemData = req.body;
    const item = await ItemModel.create(itemData);
    res.send(item);
  })
);
