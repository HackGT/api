import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { BlockModel, Block } from "../models/block";

export const blockRoutes = express.Router();

blockRoutes.route("/").get(
  checkAbility("read", "Block"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Block> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    } else {
      return res.status(400).send({ success: "false", message: "Please specify a hexathon" });
    }

    if (req.query.slug) {
      filter.slug = String(req.query.slug);
    }

    const blocks = await BlockModel.accessibleBy(req.ability).find(filter);
    return res.status(200).send(blocks);
  })
);

blockRoutes.route("/").post(
  checkAbility("create", "Block"),
  asyncHandler(async (req, res) => {
    const existingBlock = await BlockModel.findOne({
      hexathon: req.body.hexathon,
      title: req.body.title,
    });

    if (existingBlock) {
      throw new BadRequestError("Block already exists for this hexathon");
    }

    const block: Block = await BlockModel.create({
      hexathon: req.body.hexathon,
      title: req.body.title,
      slug: req.body.slug,
      content: req.body.content || " ",
    });

    return res.status(200).json(block);
  })
);

blockRoutes.route("/:id").get(
  checkAbility("read", "Block"),
  asyncHandler(async (req, res) => {
    const block = await BlockModel.findById(req.params.id).accessibleBy(req.ability);
    return res.status(200).json(block);
  })
);

blockRoutes.route("/:id").put(
  checkAbility("update", "Block"),
  asyncHandler(async (req, res) => {
    const currentBlock = await BlockModel.findById(req.params.id);
    const existingBlock = await BlockModel.findOne({
      hexathon: currentBlock?.hexathon,
      title: req.body.title,
    });

    if (existingBlock && existingBlock.id !== req.params.id) {
      throw new BadRequestError(
        `Block with title ${req.body.title} already exists for this hexathon`
      );
    }

    const block = await BlockModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          hexathon: req.body.hexathon,
          title: req.body.title,
          slug: req.body.slug,
          content: req.body.content,
        },
      },
      { new: true }
    );

    res.status(200).json(block);
  })
);

blockRoutes.route("/:id").delete(
  checkAbility("delete", "Block"),
  asyncHandler(async (req, res) => {
    await BlockModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
