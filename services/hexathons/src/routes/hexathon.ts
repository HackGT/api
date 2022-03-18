import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";

import { HexathonModel } from "../models/hexathon";

export const hexathonRouter = express.Router();

hexathonRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const hexathons = await HexathonModel.find();

    return res.status(200).send(hexathons);
  })
);

hexathonRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const { name, isActive } = req.body;
    if (!req.body.name) {
      res.status(400);
      throw new BadRequestError("Please add all fields");
    }

    const createdHexathon = await HexathonModel.create({
      name,
      isActive,
    });

    return res.status(200).send(createdHexathon);
  })
);

hexathonRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hexathon = await HexathonModel.findById(id);
    if (!hexathon) {
      res.status(400);
      throw new BadRequestError("Hexathon not found");
    }
    return res.status(200).send(hexathon);
  })
);

hexathonRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hexathon = await HexathonModel.findById(id);
    if (!hexathon) {
      res.status(400);
      throw new BadRequestError("Hexathon not found");
    }

    const updatedHexathon = await HexathonModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedHexathon);
  })
);
