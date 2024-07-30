import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { FoodBatch, FoodBatchModel } from "../models/foodBatch";

export const foodBatchRouter = express.Router();

foodBatchRouter.route("/").get(
  checkAbility("read", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const batches = await FoodBatchModel.find({});

    return res.status(200).json(batches);
  })
);

foodBatchRouter.route("/").post(
  checkAbility("create", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const newBatch = await FoodBatchModel.create(req.body);

    return res.status(200).json(newBatch);
  })
);

foodBatchRouter.route("/:id").get(
  checkAbility("read", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const batch = await FoodBatchModel.findById(req.params.id);

    if (!batch) {
      throw new BadRequestError("Batch not found.");
    }

    return res.status(200).send(batch);
  })
);

foodBatchRouter.route("/:id").put(
  checkAbility("update", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const updatedBatch = await FoodBatchModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedBatch);
  })
);

foodBatchRouter.route("/:id").delete(
  checkAbility("delete", "FoodBatch"),
  asyncHandler(async (req, res) => {
    await FoodBatchModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);
