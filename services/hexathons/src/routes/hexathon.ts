import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { Hexathon, HexathonModel } from "../models/hexathon";

export const hexathonRouter = express.Router();

hexathonRouter.route("/").get(
  checkAbility("read", "Hexathon"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Hexathon> = {};
    if (!req.user?.roles.member) {
      filter.isActive = true;
      filter.isDev = false;
    }

    const hexathons = await HexathonModel.find(filter).accessibleBy(req.ability);

    return res.status(200).json(hexathons);
  })
);

hexathonRouter.route("/").post(
  checkAbility("create", "Hexathon"),
  asyncHandler(async (req, res) => {
    const newHexathon = await HexathonModel.create(req.body);

    return res.status(200).json(newHexathon);
  })
);

hexathonRouter.route("/:id").get(
  checkAbility("read", "Hexathon"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Hexathon> = {
      _id: req.params.id,
    };
    if (!req.user?.roles.member) {
      filter.isActive = true;
      filter.isDev = false;
    }

    const hexathon = await HexathonModel.findOne(filter).accessibleBy(req.ability);

    if (!hexathon) {
      throw new BadRequestError("Hexathon not found or you do not have permission.");
    }

    return res.status(200).send(hexathon);
  })
);

hexathonRouter.route("/:id").put(
  checkAbility("update", "Hexathon"),
  asyncHandler(async (req, res) => {
    const updatedHexathon = await HexathonModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedHexathon);
  })
);

hexathonRouter.route("/:id").delete(
  checkAbility("delete", "Hexathon"),
  asyncHandler(async (req, res) => {
    await HexathonModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
