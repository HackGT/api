import {
  asyncHandler,
  BadRequestError,
  checkAbility,
  ServerError,
  ForbiddenError,
} from "@api/common";
import express from "express";
import { Types } from "mongoose";

import { FoodBatchModel } from "../models/foodBatch";
import { TeamModel } from "../models/team";
import { HexathonUserModel } from "../models/hexathonUser";

export const foodBatchRouter = express.Router();

const batchCounts: { [key: string]: number } = {};

foodBatchRouter.route("/").get(
  checkAbility("read", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const batches = await FoodBatchModel.find({});

    return res.status(200).json(batches);
  })
);

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

foodBatchRouter.route("/batch/:id").get(
  checkAbility("read", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const batch = await FoodBatchModel.findById(req.params.id);

    if (!batch) {
      throw new BadRequestError("Batch not found.");
    }

    return res.status(200).send(batch);
  })
);

foodBatchRouter.route("/batch/:id").put(
  checkAbility("update", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const updatedBatch = await FoodBatchModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedBatch);
  })
);

foodBatchRouter.route("/batch/:id").delete(
  checkAbility("delete", "FoodBatch"),
  asyncHandler(async (req, res) => {
    await FoodBatchModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);

foodBatchRouter.route("/my-batch").get(
  checkAbility("read", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const team = await TeamModel.findById(req.body.teamId);

    if (!team) {
      throw new BadRequestError("Team not found.");
    }

    if (!team.batch) {
      return res.json({});
    }

    const requestingUser = await HexathonUserModel.findOne({
      userId: req.user?.uid,
    });

    if (!requestingUser) {
      throw new BadRequestError("User not found (not authenticated?)");
    }

    if (!req.user || !team.members.includes(requestingUser.id)) {
      throw new ForbiddenError("User is not a member of the team.");
    }

    const assignedBatch = await FoodBatchModel.findById(team.batch);

    return res.json(assignedBatch || {});
  })
);

foodBatchRouter.route("/join").post(
  checkAbility("update", "FoodBatch"),
  asyncHandler(async (req, res) => {
    const team = await TeamModel.findById(req.body.teamId);

    if (!team) {
      throw new BadRequestError("Team not found.");
    }

    if (team.batch) {
      throw new BadRequestError("Team already in a batch.");
    }

    const requestingUser = await HexathonUserModel.findOne({
      userId: req.user?.uid,
    });

    if (!requestingUser) {
      throw new BadRequestError("User not found (not authenticated?)");
    }

    if (!req.user || !team.members.includes(requestingUser.id)) {
      throw new ForbiddenError(
        "User must be member of the team to join a batch on behalf of the team."
      );
    }

    let batchToJoin = null;

    if (Object.keys(batchCounts).length === 0) {
      // we may not not synced batchCounts yet, so let's just add this team to the first batch we find
      const batch = await FoodBatchModel.findOne();

      if (!batch) {
        throw new ServerError("There are no batches to join yet.");
      }

      batchToJoin = batch.id;
    } else {
      // find the least populous batch to join
      let lowestCount = Infinity;

      for (const [batchId, count] of Object.entries(batchCounts)) {
        console.log(batchId, count);
        if (count < lowestCount) {
          batchToJoin = batchId;
          lowestCount = count;
        }
      }
    }

    await TeamModel.findByIdAndUpdate(req.body.teamId, { batch: new Types.ObjectId(batchToJoin) });

    batchCounts[batchToJoin] += 1;

    return res.sendStatus(204);
  })
);

const countBatchMembers = async (foodBatchId: Types.ObjectId) => {
  const members = await TeamModel.find({ batch: foodBatchId });

  return members.length;
};

const updateLocalBatchCounts = async () => {
  const batches = await FoodBatchModel.find();

  const promises = batches.map(async batch => {
    batchCounts[batch.id.toString()] = await countBatchMembers(batch.id);
  });

  await Promise.all(promises);
};

updateLocalBatchCounts();

setInterval(
  async () => {
    try {
      await updateLocalBatchCounts();
    } catch (error) {
      console.error("Error updating local batch counts:", error);
    }
  },
  10 * 60 * 1000
); // 10 minutes in milliseconds
