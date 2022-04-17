import express from "express";
import { asyncHandler, BadRequestError, isAuthenticated } from "@api/common";

import { TeamModel } from "../models/team";

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

teamRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await TeamModel.findOne({ _id: id });

    if (!team) {
      throw new BadRequestError("Team doesn't exist!");
    }

    res.status(200).json(team);
  })
);

teamRoutes.route("/:id/accept-user").post(
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const team = await TeamModel.findOne({ _id: id, members: req.user?.uid });

    if (!team) {
      throw new BadRequestError("User must be a member of the team to accept requests!");
    }

    await team.update({
      members: [...team.members, userId],
      $pull: {
        memberRequests: { userId },
      },
    });

    res.status(200).send("Accepted user!");
  })
);

teamRoutes.route("/user/:userId").get(
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { event } = req.query;

    const filter: any = {
      members: userId,
    };

    if (event) {
      filter.event = event;
    }

    const teams = await TeamModel.find(filter);

    res.status(200).json(teams);
  })
);

teamRoutes.route("/join").post(
  isAuthenticated,
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

teamRoutes.route("/update/:id").put(
  isAuthenticated,
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
