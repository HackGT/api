import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";

import { HexathonModel } from "../models/hexathon";

export const hexathonRouter = express.Router();

hexathonRouter.route("/").get(
  asyncHandler(async (req, res) => {
    const hexathons = await HexathonModel.find();

    return res.status(200).json(hexathons);
  })
);

hexathonRouter.route("/").post(
  asyncHandler(async (req, res) => {
    const newHexathon = await HexathonModel.create({
      ...req.body,
    });

    return res.status(200).json(newHexathon);
  })
);

hexathonRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    const hexathon = await HexathonModel.findById(req.params.id);

    if (!hexathon) {
      throw new BadRequestError("Hexathon not found");
    }

    return res.status(200).send(hexathon);
  })
);

hexathonRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    const updatedHexathon = await HexathonModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedHexathon);
  })
);
