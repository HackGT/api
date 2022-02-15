import { asyncHandler } from "@api/common";
import express from "express";
import { InteractionModel } from "../models/interaction";

export const interactionRoutes = express.Router();

interactionRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    return res.send();
  })
);

interactionRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    return res.send();
  })
);

interactionRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

interactionRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
