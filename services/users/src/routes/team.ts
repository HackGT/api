import express from "express";
import { asyncHandler } from "@api/common/src/middleware";
import { BadRequestError } from "@api/common/src/errors";
import { isAuthenticated } from "@api/common";

import { TeamModel, Team } from "../models/team";

export const teamRoutes = express.Router();

teamRoutes.route("/").post(
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { name, event, description, publicTeam } = req.body;

    const team = await TeamModel.findOne({ name, event });

    if (team) {
      throw new BadRequestError("Team with this name already exists!");
    }

    const teams = await TeamModel.find({ event, members: req.user?.uid });

    if (teams.length !== 0) {
      throw new BadRequestError("User is already in a team for this event!");
    }

    await TeamModel.create({
      name,
      event,
      members: [req.user?.uid],
      description,
      public: publicTeam,
    });

    res.status(200).send("Team created!");
  })
);

teamRoutes.route("/").get(
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { event } = req.query;

    let teams;

    if (!event) {
      teams = await TeamModel.find();
    } else {
      teams = await TeamModel.find({ event });
    }

    res.status(200).json(teams);
  })
);

teamRoutes.route("/join").post(
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const { event } = req.query;

    const team = await TeamModel.findOne({ name, event });

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (team.members.includes(req.user?.uid as string)) {
      throw new BadRequestError("User has already joined this team!");
    }

    const userId = req.user?.uid;

    const teams = await TeamModel.find({ event, members: req.user?.uid });

    if (teams.length !== 0) {
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
  isAuthenticated,
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

    res.status(200).send("User left team!");
  })
);
