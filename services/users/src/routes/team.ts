import express from "express";
import { asyncHandler } from "@api/common/src/middleware";
import { BadRequestError } from "@api/common/src/errors";

import { TeamModel, Team } from "../models/team";

export const teamRoutes = express.Router();

teamRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const { name, event, members, description, publicTeam } = req.body;

    const team = await TeamModel.findOne({ name, event });

    if (team) {
      throw new BadRequestError("Team with this name already exists!");
    }

    await TeamModel.create({
      name,
      event,
      members: [req.user?.uid, ...(members || [])],
      description,
      public: publicTeam,
    });

    res.status(200).send("Team created!");
  })
);

teamRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const { event } = req.body;

    const teams = await TeamModel.find({ event });
    res.status(200).json(teams);
  })
);

teamRoutes.route("/join").post(
  asyncHandler(async (req, res) => {
    const { name, event } = req.body;

    const team = await TeamModel.findOne({ name, event });

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    const userId = req.user?.uid;

    const existingTeam = await TeamModel.find({ event, members: userId });

    if (existingTeam) {
      throw new BadRequestError(
        "User cannot join an team for an event they are already in a team for!"
      );
    }

    await team.update({
      members: [...team.members, userId],
    });

    res.status(200).send("User added to team!");
  })
);

teamRoutes.route("/leave").post(
  asyncHandler(async (req, res) => {
    const { name, event } = req.body;

    const team = await TeamModel.findOne({ name, event });
    const userId = req.user?.uid;

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (!team.members.includes(userId as string)) {
      throw new BadRequestError("User isn't a member of the team!");
    }

    await team.update({
      members: team.members.filter(member => member !== userId),
    });
  })
);
