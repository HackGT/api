/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery } from "mongoose";

import { VisitModel, Visit } from "../models/visit";

export const visitRouter = express.Router();

// get visit
visitRouter.route("/").get(
  checkAbility("read", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );
    const filter: FilterQuery<Visit> = {};
    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }
    if (req.query.visitorId) {
      filter.visitorId = String(req.query.visitorId);
    }
    if (company) {
      filter.company = String(company.id);
    }

    const visits = await VisitModel.accessibleBy(req.ability).find(filter);
    return res.status(200).send(visits);
  })
);

visitRouter.route("/:visitorId").get(
  checkAbility("read", "Visit"),
  asyncHandler(async (req, res) => {
    // get company of current user
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (company) {
      const { visitorId } = req.params;
      const visit = await VisitModel.findOne({
        visitorId,
        company: company.id,
      });

      return res.status(200).send(visit?.toJSON());
    } 
      throw new BadRequestError("Current user not associated with a company");
    
  })
);

visitRouter.route("/:visitorId").post(
  checkAbility("create", "Visit"),
  asyncHandler(async (req, res) => {
    // get company of current user
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (company) {
      const visit = await VisitModel.create({
        visitorId: req.params.visitorId,
        hexathon: req.body.hexathon,
        company: company.id,
        employees: req.body.employees,
        tags: req.body.tags,
        notes: req.body.notes,
        time: new Date(),
      });
      res.send(visit);
    } else {
      throw new BadRequestError("Current user not associated with a company");
    }
  })
);

visitRouter.route("/:visitorId").put(
  checkAbility("update", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    const visit = await VisitModel.findOne({
      visitorId: req.params.visitorId,
      company: company.id,
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
        company: company.id,
      },
      {
        tags: newTags,
        notes: visit.notes.concat(req.body.notes),
        employees: addEmployees,
      },
      { new: true }
    );
    res.send(newVisit);
  })
);
