import express from "express";
import { asyncHandler, BadRequestError, checkAbility, ForbiddenError } from "@api/common";
import { FilterQuery } from "mongoose";

import { Team, TeamModel } from "../models/team";
import { ProfileModel } from "../models/profile";

export const teamRoutes = express.Router();

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
      throw new BadRequestError("Invalid team or you do not have permission.");
    }

    res.status(200).json(team);
  })
);

teamRoutes.route("/").post(
  checkAbility("create", "Team"),
  asyncHandler(async (req, res) => {
    const { name, hexathon, description, publicTeam } = req.body;

    const existingTeam = await TeamModel.findOne({ name, hexathon });
    if (existingTeam) {
      throw new BadRequestError("Team with this name already exists!");
    }

    const existingTeamWithUser = await TeamModel.findOne({ hexathon, members: req.user?.uid });
    if (existingTeamWithUser) {
      throw new BadRequestError("User is already in a team for this event!");
    }

    const newTeam = await TeamModel.create({
      name,
      hexathon,
      members: [req.user?.uid],
      description,
      public: publicTeam,
    });

    res.status(200).send(newTeam);
  })
);

teamRoutes.route("/add").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { hexathon, email } = req.body;

    const userToAdd = await ProfileModel.findOne({
      email,
    });
    if (!userToAdd) {
      throw new BadRequestError("User associated with email not found.");
    }

    const existingTeam = await TeamModel.findOne({ hexathon, members: userToAdd.userId });
    if (existingTeam) {
      throw new BadRequestError("User has already joined another team for this event.");
    }

    const teamToJoin = await TeamModel.findOne({
      hexathon,
      members: req.user?.uid,
    });

    if (!teamToJoin) {
      throw new BadRequestError("Current user is not a part of a team!");
    }
    if (teamToJoin.members.length >= 4) {
      throw new BadRequestError("Teams can only have up to 4 members.");
    }
    if (teamToJoin.members.includes(userToAdd.userId)) {
      throw new BadRequestError("New user is already on this team.");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamToJoin.id,
      {
        members: [...teamToJoin.members, userToAdd.userId],
      },
      {
        new: true,
      }
    );

    res.status(200).json(updatedTeam);
  })
);

teamRoutes.route("/:id/accept-user").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const team = await TeamModel.findById(req.params.id);

    if (!team) {
      throw new BadRequestError("Invalid team or you do not have permission.");
    }

    if (!req.user || !team.members.includes(req.user.uid)) {
      throw new ForbiddenError("User must be member of the team to accept a user.");
    }

    if (team.members.length >= 4) {
      throw new ForbiddenError("Team cannot have more than 4 members.");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(team.id, {
      members: [...team.members, req.body.userId],
      $pull: {
        memberRequests: { userId: req.body.userId },
      },
    });

    res.status(200).send(updatedTeam);
  })
);

teamRoutes.route("/user/:userId").get(
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Team> = {
      hexathon: req.query.hexathon,
      members: req.params.userId,
    };

    const team = await TeamModel.findOne(filter);
    if (!team) {
      res.status(200).json({});
      return;
    }

    const profiles = await ProfileModel.find({
      userId: {
        $in: team.members,
      },
    });

    if (profiles.length !== team.members.length) {
      throw new BadRequestError("Not all team members have profiles.");
    }

    res.status(200).json({
      ...team.toJSON(),
      members: profiles,
    });
  })
);

teamRoutes.route("/join").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { name, hexathon, message } = req.body;

    const existingTeam = await TeamModel.findOne({ hexathon, members: req.user?.uid });
    if (existingTeam) {
      throw new BadRequestError(
        "User cannot join a team for an event they are already in a team for!"
      );
    }

    const team = await TeamModel.findOne({ name, hexathon });
    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (team.members.includes(req.user?.uid as string)) {
      throw new BadRequestError("User has already joined this team!");
    }

    const teamPendingReq = await TeamModel.findOne({
      hexathon,
      memberRequests: {
        $elemMatch: {
          userId: req.user?.uid,
        },
      },
    });

    if (teamPendingReq) {
      if (team.id.equals(teamPendingReq.id)) {
        throw new BadRequestError("User has already requested to join this team!");
      }
      await teamPendingReq.updateOne({
        $pull: {
          memberRequests: { userId: req.user?.uid },
        },
      });
    }

    await TeamModel.findByIdAndUpdate(
      team.id,
      {
        memberRequests: [...team.memberRequests, { userId: req.user?.uid, message }],
      },
      { new: true }
    );

    res.status(200).send("Join Request has been sent!");
  })
);

teamRoutes.route("/leave").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { name, hexathon } = req.body;

    const team = await TeamModel.findOne({ name, hexathon });

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (!team.members.includes(req.user?.uid ?? "")) {
      throw new BadRequestError("User isn't a member of the team!");
    }

    await TeamModel.findByIdAndUpdate(
      team.id,
      {
        $pull: {
          members: req.user?.uid,
        },
      },
      { new: true }
    );

    if (team.members.length <= 1) {
      await TeamModel.findByIdAndDelete(team.id);
    }

    res.sendStatus(204);
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
