import express from "express";
import { asyncHandler, BadRequestError, checkAbility, ForbiddenError } from "@api/common";
import { FilterQuery, isValidObjectId, Types } from "mongoose";

import { Team, TeamModel } from "../models/team";
import { HexathonUserModel } from "../models/hexathonUser";
import { validateEmail } from "src/common/util";

export const teamRoutes = express.Router();

teamRoutes.route("/").get(
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Team> = {};

    if (req.query.hexathon) {
      filter.hexathon = req.query.hexathon;
    }

    if (req.query.userId) {
      const hexathonUser = await HexathonUserModel.findOne({
        hexathon: req.query.hexathon,
        userId: req.query.userId,
      });
      if (!hexathonUser) {
        throw new BadRequestError("No hexathon user for the user id.");
      }
      filter.members = hexathonUser.id;
    }

    if (req.query.search) {
      const searchLength = (req.query.search as string).length;
      const search =
        searchLength > 75
          ? (req.query.search as string).slice(0, 75)
          : (req.query.search as string);
      filter.$or = [
        { _id: isValidObjectId(search) ? new Types.ObjectId(search) : undefined },
        { name: { $regex: new RegExp(search, "i") } },
      ];
    }

    const teamsCount = await TeamModel.accessibleBy(req.ability).find(filter).count();

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const teams = await TeamModel.accessibleBy(req.ability)
      .populate("members memberRequests.member sentInvites.member")
      .find(filter)
      .skip(offset)
      .limit(limit);

    res.status(200).json({
      offset,
      total: teamsCount,
      count: teams.length,
      teams,
    });
  })
);

teamRoutes.route("/:id").get(
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    const team = await TeamModel.findById(req.params.id)
      .accessibleBy(req.ability)
      .populate("members memberRequests.member sentInvites.member");

    if (!team) {
      throw new BadRequestError("Invalid team or you do not have permission.");
    }

    res.status(200).json(team);
  })
);

teamRoutes.route("/").post(
  checkAbility("create", "Team"),
  asyncHandler(async (req, res) => {
    const { name, hexathon, email, description, publicTeam } = req.body;

    const hexathonUser = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      email: { $eq: email },
    });

    // If the requesting user hasn't applied yet, do not create a team
    if (!hexathonUser) {
      throw new BadRequestError("User has not registered for this event!");
    }

    const existingTeam = await TeamModel.findOne({ name, hexathon });
    if (existingTeam) {
      throw new BadRequestError("Team with this name already exists!");
    }

    const existingTeamWithUser = await TeamModel.findOne({ hexathon, members: hexathonUser.id });
    if (existingTeamWithUser) {
      throw new BadRequestError("User is already in a team for this event!");
    }

    const newTeam = await TeamModel.create({
      name,
      hexathon,
      members: [hexathonUser.id],
      description,
      public: publicTeam,
    });

    await HexathonUserModel.findByIdAndUpdate(hexathonUser.id, {
      $set: {
        "profile.matched": false,
      },
    });

    res.status(200).send(newTeam);
  })
);

teamRoutes.route("/add").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { hexathon, email } = req.body;

    if (!validateEmail(email)) {
      throw new BadRequestError("Invalid email provided.");
    }

    const userToAdd = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      email: { $eq: email },
    });
    if (!userToAdd) {
      throw new BadRequestError("User associated with email not found.");
    }

    const existingTeam = await TeamModel.findOne({ hexathon, members: userToAdd.id });
    if (existingTeam) {
      throw new BadRequestError("User has already joined another team for this event.");
    }

    const teamToJoin = await TeamModel.findOne({
      hexathon,
      members: userToAdd.id,
    });

    if (!teamToJoin) {
      throw new BadRequestError("Current user is not a part of a team!");
    }
    if (teamToJoin.members.length >= 4) {
      throw new BadRequestError("Teams can only have up to 4 members.");
    }
    if (teamToJoin.members.includes(userToAdd.id)) {
      throw new BadRequestError("New user is already on this team.");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamToJoin.id,
      {
        members: [...teamToJoin.members, userToAdd.id],
      },
      {
        new: true,
      }
    );

    await HexathonUserModel.findByIdAndUpdate(userToAdd.id, {
      $set: {
        "profile.matched": false,
      },
    });

    res.status(200).json(updatedTeam);
  })
);

teamRoutes.route("/:id/accept-user").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { hexathon, email } = req.body;
    const team = await TeamModel.findById(req.params.id);
    const userToAccept = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      email: { $eq: email },
    });
    if (!userToAccept) {
      throw new BadRequestError("User associated with email not found.");
    }
    if (!team) {
      throw new BadRequestError("Invalid team or you do not have permission.");
    }

    if (!req.user || !team.members.includes(userToAccept.id)) {
      throw new ForbiddenError("User must be member of the team to accept a user.");
    }

    if (team.members.length >= 4) {
      throw new ForbiddenError("Team cannot have more than 4 members.");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(team.id, {
      members: [...team.members, userToAccept.id],
      $pull: {
        memberRequests: { member: userToAccept.id },
      },
    });

    res.status(200).send(updatedTeam);
  })
);

teamRoutes.route("/:id/reject-user").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { hexathon, email } = req.body;
    const team = await TeamModel.findById(req.params.id);
    const userToReject = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      email: { $eq: email },
    });
    if (!userToReject) {
      throw new BadRequestError("User associated with email not found.");
    }
    if (!team) {
      throw new BadRequestError("Invalid team or you do not have permission.");
    }

    if (!req.user || !team.members.includes(userToReject.id)) {
      throw new ForbiddenError("User must be member of the team to reject a user.");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(team.id, {
      $pull: {
        memberRequests: { member: userToReject.id },
      },
    });

    res.status(200).send(updatedTeam);
  })
);

teamRoutes.route("/join").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { name, hexathon, email, message } = req.body;

    const userToJoin = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      email: { $eq: email },
    });
    if (!userToJoin) {
      throw new BadRequestError("User associated with email not found.");
    }

    const existingTeam = await TeamModel.findOne({ hexathon, members: userToJoin.id });
    if (existingTeam) {
      throw new BadRequestError(
        "User cannot join a team for an event they are already in a team for!"
      );
    }

    const team = await TeamModel.findOne({ name, hexathon });
    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (team.members.includes(userToJoin.id)) {
      throw new BadRequestError("User has already joined this team!");
    }

    const teamPendingReq = await TeamModel.findOne({
      hexathon,
      memberRequests: {
        $elemMatch: {
          member: userToJoin.id,
        },
      },
    });

    if (teamPendingReq) {
      if (team.id === teamPendingReq.id) {
        throw new BadRequestError("User has already requested to join this team!");
      }
      await teamPendingReq.updateOne({
        $pull: {
          memberRequests: { member: userToJoin.id },
        },
      });
    }

    await TeamModel.findByIdAndUpdate(
      team.id,
      {
        memberRequests: [...team.memberRequests, { member: userToJoin.id, message }],
      },
      { new: true }
    );

    res.status(200).send("Join Request has been sent!");
  })
);

teamRoutes.route("/send-invite").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { hexathon, email, message } = req.body;

    const userToInvite = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      email: { $eq: email },
    });

    const invitingUser = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      userId: req.user?.uid,
    });

    if (!userToInvite) {
      throw new BadRequestError("User associated with email not found.");
    }

    if (!invitingUser) {
      throw new BadRequestError("User has not registered for this event!");
    }

    const existingTeam = await TeamModel.findOne({ hexathon, members: userToInvite.id });
    if (existingTeam) {
      throw new BadRequestError("User has already joined another team for this event.");
    }

    const teamToInvite = await TeamModel.findOne({
      hexathon,
      members: invitingUser.id,
    });

    if (!teamToInvite) {
      throw new BadRequestError("Current user is not a part of a team!");
    }
    if (teamToInvite.members.length >= 4) {
      throw new BadRequestError("Teams can only have up to 4 members.");
    }
    if (teamToInvite.members.includes(userToInvite.id)) {
      throw new BadRequestError("New user is already on this team.");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamToInvite.id,
      {
        sentInvites: [...teamToInvite.sentInvites, { member: userToInvite.id, message }],
      },
      {
        new: true,
      }
    );

    res.status(200).json(updatedTeam);
  })
);

teamRoutes.route("/accept-invite").post(
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    const { hexathon, name } = req.body;

    const acceptingUser = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      userId: req.user?.uid,
    });

    if (!acceptingUser) {
      throw new BadRequestError("User has not registered for this event!");
    }

    const teamToJoin = await TeamModel.findOne({
      hexathon,
      name,
    });

    if (!teamToJoin) {
      throw new BadRequestError("Team does not exist!");
    }

    if (teamToJoin.members.length >= 4) {
      throw new BadRequestError("Teams can only have up to 4 members.");
    }

    if (teamToJoin.members.includes(acceptingUser.id)) {
      throw new BadRequestError("User is already on this team.");
    }

    const invite = await TeamModel.findOne({
      hexathon,
      sentInvites: {
        $elemMatch: {
          member: acceptingUser.id,
        },
      },
    });

    if (!invite) {
      throw new BadRequestError("User does not have an invite for this team!");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamToJoin.id,
      {
        members: [...teamToJoin.members, acceptingUser.id],
        $pull: {
          sentInvites: { member: acceptingUser.id },
        },
      },
      {
        new: true,
      }
    );

    await HexathonUserModel.updateOne(
      { userId: req.user?.uid },
      {
        $set: {
          matched: false,
        },
      }
    );

    res.status(200).json(updatedTeam);
  })
);

teamRoutes.route("/reject-invite").post(
  checkAbility("read", "Team"),
  asyncHandler(async (req, res) => {
    const { hexathon, name } = req.body;

    const rejectingUser = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      userId: req.user?.uid,
    });

    if (!rejectingUser) {
      throw new BadRequestError("User has not registered for this event!");
    }

    const teamToReject = await TeamModel.findOne({
      hexathon,
      name,
    });

    if (!teamToReject) {
      throw new BadRequestError("Team does not exist!");
    }

    const invite = await TeamModel.findOne({
      hexathon,
      sentInvites: {
        $elemMatch: {
          member: rejectingUser.id,
        },
      },
    });

    if (!invite) {
      throw new BadRequestError("User does not have an invite for this team!");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamToReject.id,
      {
        $pull: {
          sentInvites: { member: rejectingUser.id },
        },
      },
      {
        new: true,
      }
    );

    res.status(200).json(updatedTeam);
  })
);

teamRoutes.route("/leave").post(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { name, hexathon } = req.body;

    const team = await TeamModel.findOne({ name, hexathon });

    const userToLeave = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      userId: req.user?.uid,
    });

    if (!userToLeave) {
      throw new BadRequestError("User has not registered for this event!");
    }

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (!team.members.includes(userToLeave.id)) {
      throw new BadRequestError("User isn't a member of the team!");
    }

    await TeamModel.findByIdAndUpdate(
      team.id,
      {
        $pull: {
          members: userToLeave.id,
        },
      },
      { new: true }
    );

    if (team.members.length <= 1) {
      await TeamModel.findByIdAndDelete(team.id);
    }

    await HexathonUserModel.updateOne(
      { userId: req.user?.uid },
      {
        $set: {
          matched: true,
        },
      }
    );

    res.sendStatus(204);
  })
);

teamRoutes.route("/:id").put(
  checkAbility("update", "Team"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { hexathon } = req.body;

    const team = await TeamModel.findById(id);

    const requestingUser = await HexathonUserModel.findOne({
      hexathon: { $eq: hexathon },
      userId: req.user?.uid,
    });

    if (!requestingUser) {
      throw new BadRequestError("User has not registered for this event!");
    }

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    if (!team.members.includes(requestingUser.id)) {
      throw new BadRequestError("User isn't a member of the team!");
    }

    const updatedTeam = await TeamModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).send(updatedTeam);
  })
);
