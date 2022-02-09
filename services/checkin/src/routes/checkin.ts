import { asyncHandler } from "@api/common";
import express from "express";

export const checkinRouter = express.Router();

checkinRouter.route("/").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

checkinRouter.route("/").post(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

checkinRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

checkinRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
