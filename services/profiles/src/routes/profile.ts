import { asyncHandler } from "@api/common";
import express from "express";

export const profileRoutes = express.Router();

profileRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

profileRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

profileRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

profileRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
