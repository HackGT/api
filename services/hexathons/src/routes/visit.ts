/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery } from "mongoose";

import { VisitModel, Visit } from "../models/visit";

export const sponsorVisitRouter = express.Router();

sponsorVisitRouter.route("/").get(
  checkAbility("read", "Visit"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon is required parameter");
    }
    const companies = await apiCall(
      Service.USERS,
      {
        method: "GET",
        url: `/companies/employees/${req.user?.uid}`,
        params: {
          hexathon: req.query.hexathon,
        },
      },
      req
    );

    if (companies.length === 0) {
      throw new BadRequestError("Current user not associated with company in hexathon");
    }

    const filter: FilterQuery<Visit> = {};
    filter.company = String(companies[0].id);
    filter.hexathon = String(req.query.hexathon);

    if (req.query.visitorId) {
      filter.visitorId = String(req.query.visitorId);
    }

    const visits = await VisitModel.accessibleBy(req.ability).find(filter);
    return res.status(200).send(visits);
  })
);

sponsorVisitRouter.route("/").post(
  checkAbility("create", "Visit"),
  asyncHandler(async (req, res) => {
    if (!req.body.hexathon) {
      throw new BadRequestError("Hexathon is required body field");
    }

    const companies = await apiCall(
      Service.USERS,
      {
        method: "GET",
        url: `/companies/employees/${req.user?.uid}`,
        params: {
          hexathon: req.body.hexathon,
        },
      },
      req
    );

    if (companies.length === 0 || !req.user) {
      throw new BadRequestError("Current user not associated with a company");
    }

    const visit = await VisitModel.create({
      visitorId: req.body.visitorId,
      hexathon: req.body.hexathon,
      company: companies[0].id,
      employee: req.user.uid,
      starred: req.body.starred,
      tags: req.body.tags,
      notes: req.body.notes,
      time: new Date(),
    });

    res.send(visit);
  })
);

sponsorVisitRouter.route("/:visitId").get(
  checkAbility("read", "Visit"),
  asyncHandler(async (req, res) => {
    // get company of current user

    const { visitId } = req.params;
    const visit = await VisitModel.findById(visitId);

    if (!visit) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }
    console.log(visit);

    const companies = await apiCall(
      Service.USERS,
      {
        method: "GET",
        url: `/companies/employees/${req.user?.uid}`,
        params: {
          hexathon: String(visit.hexathon),
        },
      },
      req
    );

    if (companies.length === 0 || String(visit.company) !== companies[0].id) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }

    return res.status(200).send(visit?.toJSON());
  })
);

sponsorVisitRouter.route("/:visitId").put(
  checkAbility("update", "Visit"),
  asyncHandler(async (req, res) => {
    const visit = await VisitModel.findById(req.params.visitId);
    if (!visit) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }
    const companies = await apiCall(
      Service.USERS,
      {
        method: "GET",
        url: `/companies/employees/${req.user?.uid}`,
        params: {
          hexathon: String(visit.hexathon),
        },
      },
      req
    );

    if (companies.length === 0 || String(visit.company) !== companies[0].id) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }
    const updatedVisit = await visit?.update(
      {
        starred: req.body.starred,
        tags: req.body.tags,
        notes: req.body.notes,
      },
      { new: true }
    );
    return res.status(200).send(updatedVisit);
  })
);

sponsorVisitRouter.route("/:visitId").delete(
  checkAbility("update", "Visit"),
  asyncHandler(async (req, res) => {
    const visit = await VisitModel.findById(req.params.visitId);
    if (!visit) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }
    const companies = await apiCall(
      Service.USERS,
      {
        method: "GET",
        url: `/companies/employees/${req.user?.uid}`,
        params: {
          hexathon: String(visit.hexathon),
        },
      },
      req
    );

    if (companies.length === 0 || String(visit.company) !== companies[0].id) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }

    await VisitModel.findByIdAndDelete(req.params.visitId);
    return res.sendStatus(204);
  })
);
