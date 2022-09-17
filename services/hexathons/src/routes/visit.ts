/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { rest } from "lodash";

import { VisitModel } from "../models/visit";

export const visitRouter = express.Router();

// get visit
visitRouter.route("/:visitorId").get(
  checkAbility("read", "Visit"),
  asyncHandler(async (req, res) => {
    // get company of current user
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/employees/${req.user?.uid}` },
      req
    );

    const {visitorId} = req.params;
    const visit = await VisitModel.findOne({
      visitorId,
      company,
    });

    return res.status(200).send(visit?.toJSON());
  })
);

visitRouter.route("/:visitorId").post(
  checkAbility("create", "Visit"),
  asyncHandler(async (req, res) => {
    // get company of current user
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/employees/${req.user?.uid}` },
      req
    );

    const visit = await VisitModel.create({
      visitorId: req.params.visitorId,
      hexathon: req.body.hexathon,
      company,
      employees: req.body.employees,
      tags: req.body.tags,
      notes: req.body.notes,
      time: new Date(),
    });
    res.send(visit);
  })
);

visitRouter.route("/:visitorId").put(
  checkAbility("update", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/employees/${req.user?.uid}` },
      req
    );

    const visit = await VisitModel.findOne({
      visitorId: req.params.visitorId,
      company,
    });

    if (!visit) {
      throw new BadRequestError("No visit exists between current user's company and the attendee");
    }

    const newTags = visit.tags;
    const addEmployees = visit?.employees;

    if (req.body.tags) {
      for (const tag of req.body.tags) {
        if (!newTags.includes(tag)) {
          newTags.push(tag);
        }
      }
    }

    if (req.body.employees) {
      for (const emp of req.body.employees) {
        if (!addEmployees.includes(emp)) {
          addEmployees.push(emp);
        }
      }
    }

    const newVisit = await VisitModel.findOneAndUpdate(
      {
        visitorId: req.params.visitorId,
        company,
      },
      {
        tags: newTags,
        notes: visit.notes.concat(req.body.notes),
        employees: addEmployees,
      }
    );
    res.send(newVisit);
  })
);
