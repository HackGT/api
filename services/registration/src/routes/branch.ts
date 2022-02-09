import { asyncHandler } from "@api/common";
import express from "express";

export const branchRouter = express.Router();

branchRouter.route("/").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

branchRouter.route("/").post(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

branchRouter.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

branchRouter.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);
