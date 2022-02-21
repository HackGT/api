import { asyncHandler } from "@api/common";
import express from "express";

export const notificationsRoutes = express.Router();

notificationsRoutes.route("/").get(asyncHandler(async (req, res) => res.send()));

notificationsRoutes.route("/").post(asyncHandler(async (req, res) => res.send()));

notificationsRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

notificationsRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
