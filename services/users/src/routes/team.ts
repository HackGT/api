import express from "express";
import { asyncHandler, BadRequestError, checkAbility, ForbiddenError } from "@api/common";
import { FilterQuery } from "mongoose";

import { Team, TeamModel } from "../models/team";

export const teamRoutes = express.Router();

teamRoutes.route("/").post(
  checkAbility("create", "Team"),
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
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Team> = {};

    if (req.query.hexathon) {
      filter.hexathon = req.query.hexathon;
    }

    const teams = await TeamModel.accessibleBy(req.ability).find(filter);

    res.status(200).json(teams);
  })
);

teamRoutes.route("/:id").get(
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    const team = await TeamModel.findById(req.params.id).accessibleBy(req.ability);

    if (!team) {
      throw new BadRequestError("Invalid team or you do not have permisison.");
    }

    res.status(200).json(team);
  })
);

teamRoutes.route("/:id/accept-user").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const team = await TeamModel.findById(req.params.id);

    if (!team) {
      throw new BadRequestError("Invalid team or you do not have permisison.");
    }

    if (!req.user || !team.members.includes(req.user.uid)) {
      throw new ForbiddenError("User must be member of the team to accept a user.");
    }

    await team.update({
      members: [...team.members, req.body.userId],
      $pull: {
        memberRequests: { userId: req.body.userId },
      },
    });

    res.status(200).send("Accepted user!");
  })
);

teamRoutes.route("/user/:userId").get(
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Team> = {
      members: req.params.userId,
    };

    if (req.query.hexathon) {
      filter.hexathon = req.query.hexathon;
    }

    const teams = await TeamModel.find(filter);

    res.status(200).json(teams);
  })
);

teamRoutes.route("/join").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { name, event, message } = req.body;

    const team = await TeamModel.findOne({ name, event });

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (team.members.includes(req.user?.uid as string)) {
      throw new BadRequestError("User has already joined this team!");
    }

    const userId = req.user?.uid;

    const teams = await TeamModel.findOne({ event, members: req.user?.uid });

    if (teams) {
      throw new BadRequestError(
        "User cannot join a team for an event they are already in a team for!"
      );
    }

    const teamPendingReq = await TeamModel.findOne({
      event,
      memberRequests: {
        $elemMatch: {
          userId,
        },
      },
    });

    if (teamPendingReq) {
      if (team._id.equals(teamPendingReq._id)) {
        throw new BadRequestError("User has already requested to join this team!");
      }
      await teamPendingReq.updateOne({
        $pull: {
          memberRequests: { userId },
        },
      });
    }

    await team.update({
      memberRequests: [...team.memberRequests, { userId, message }],
    });

    res.status(200).send("Join Request has been sent!");
  })
);

teamRoutes.route("/leave").post(
  checkAbility("update", "Team"),
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

teamRoutes.route("/:id").put(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await TeamModel.findById(id);
    const userId = req.user?.uid;

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (!team.members.includes(userId as string)) {
      throw new BadRequestError("User isn't a member of the team!");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).send(updatedTeam);
  })
);
