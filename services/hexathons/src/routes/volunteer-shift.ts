import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { FilterQuery } from "mongoose";

import { VolunteerShiftModel, VolunteerShift } from "../models/volunteerShift";
import { HexathonUserModel } from "../models/hexathonUser";

export const volunteerShiftRoutes = express.Router();

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

volunteerShiftRoutes.route("/me").get(
  checkAbility("read", "VolunteerShift"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<VolunteerShift> = {
      assignees: req.user?.uid,
    };

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const shifts = await VolunteerShiftModel.accessibleBy(req.ability)
      .find(filter)
      .sort({ startDate: 1 });

    return res.send(shifts);
  })
);

volunteerShiftRoutes.route("/").get(
  checkAbility("read", "VolunteerShift"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<VolunteerShift> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const shifts = await VolunteerShiftModel.accessibleBy(req.ability)
      .find(filter)
      .sort({ startDate: 1 });

    return res.send(shifts);
  })
);

volunteerShiftRoutes.route("/:id").get(
  checkAbility("read", "VolunteerShift"),
  asyncHandler(async (req, res) => {
    const shift = await VolunteerShiftModel.findById(req.params.id).accessibleBy(req.ability);
    return res.send(shift);
  })
);

volunteerShiftRoutes.route("/:id").patch(
  checkAbility("update", "VolunteerShift"),
  asyncHandler(async (req, res) => {
    const shift = await VolunteerShiftModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          hexathon: req.body.hexathon,
          name: req.body.name,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          location: req.body.location,
          tags: req.body.tags,
          assignees: req.body.assignees,
        },
      },
      { new: true }
    );

    res.send(shift);
  })
);

volunteerShiftRoutes.route("/:id").delete(
  checkAbility("delete", "VolunteerShift"),
  asyncHandler(async (req, res) => {
    await VolunteerShiftModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);

volunteerShiftRoutes.route("/import").post(
  checkAbility("create", "VolunteerShift"),
  asyncHandler(async (req, res) => {
    if (!req.body.hexathon) {
      throw new BadRequestError("hexathon is required");
    }

    if (
      !Array.isArray(req.body.assignees) ||
      !req.body.assignees.every((name: unknown) => typeof name === "string")
    ) {
      throw new BadRequestError("assignees must be an array of full names");
    }

    const namesByKey = new Map<string, string>();
    req.body.assignees.forEach((name: string) => {
      const key = normalizeName(name);
      if (key && !namesByKey.has(key)) {
        namesByKey.set(key, name.trim());
      }
    });

    const hexathonUsers = await HexathonUserModel.find({
      hexathon: req.body.hexathon,
      name: {
        $in: [...namesByKey.keys()].map(
          key => new RegExp(`^\\s*${escapeRegex(key).replace(/ /g, "\\s+")}\\s*$`, "i")
        ),
      },
    });

    const userIdsByKey = new Map<string, string[]>();
    hexathonUsers.forEach(user => {
      const key = normalizeName(user.name);
      userIdsByKey.set(key, [...(userIdsByKey.get(key) ?? []), user.userId]);
    });

    const assignees: string[] = [];
    const unmatched: string[] = [];
    const ambiguous: string[] = [];
    namesByKey.forEach((name, key) => {
      const userIds = userIdsByKey.get(key) ?? [];
      if (userIds.length === 1) {
        assignees.push(userIds[0]);
      } else if (userIds.length === 0) {
        unmatched.push(name);
      } else {
        ambiguous.push(name);
      }
    });

    const shift = await VolunteerShiftModel.create({
      hexathon: req.body.hexathon,
      name: req.body.name,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      tags: req.body.tags,
      assignees,
    });

    return res.send({ shift, unmatched, ambiguous });
  })
);

volunteerShiftRoutes.route("/").post(
  checkAbility("create", "VolunteerShift"),
  asyncHandler(async (req, res) => {
    const shift = await VolunteerShiftModel.create({
      hexathon: req.body.hexathon,
      name: req.body.name,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      location: req.body.location,
      tags: req.body.tags,
      assignees: req.body.assignees,
    });

    return res.send(shift);
  })
);
