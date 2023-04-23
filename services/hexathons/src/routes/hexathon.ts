import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { HexathonModel } from "../models/hexathon";

export const hexathonRouter = express.Router();

hexathonRouter.route("/").get(
  checkAbility("read", "Hexathon"),
  asyncHandler(async (req, res) => {
    const hexathons = await HexathonModel.find().accessibleBy(req.ability);

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
    const hexathon = await HexathonModel.findById(req.params.id).accessibleBy(req.ability);

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
