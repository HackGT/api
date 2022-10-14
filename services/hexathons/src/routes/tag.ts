import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { TagModel, Tag } from "../models/tag";

export const tagRoutes = express.Router();

tagRoutes.route("/").get(
  checkAbility("read", "Tag"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Tag> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const tags = await TagModel.accessibleBy(req.ability).find(filter);

    return res.send(tags);
  })
);

tagRoutes.route("/").post(
  checkAbility("create", "Tag"),
  asyncHandler(async (req, res) => {
    const existingTag = await TagModel.findOne({
      hexathon: req.body.hexathon,
      name: req.body.name,
    });

    if (existingTag) {
      throw new BadRequestError("Tag already exists for this hexathon");
    }

    const event = await TagModel.create({
      hexathon: req.body.hexathon,
      name: req.body.name,
    });

    return res.send(event);
  })
);

tagRoutes.route("/:id").put(
  checkAbility("update", "Tag"),
  asyncHandler(async (req, res) => {
    const currentTag = await TagModel.findById(req.params.id);
    const existingTag = await TagModel.findOne({
      hexathon: currentTag?.hexathon,
      name: req.body.name,
    });

    if (currentTag?.id !== req.params.id) {
      throw new BadRequestError(
        `Event with name ${req.body.name} already exists for this hexathon`
      );
    }

    const tag = await TagModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
        },
      },
      { new: true }
    );

    res.send(tag);
  })
);

tagRoutes.route("/:id").delete(
  checkAbility("delete", "Tag"),
  asyncHandler(async (req, res) => {
    await TagModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
