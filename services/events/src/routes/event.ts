import { asyncHandler } from "@api/common";
import express from "express";

export const eventRouter = express.Router();

eventRouter.route("/").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

eventRouter.route("/").post(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

eventRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

eventRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
