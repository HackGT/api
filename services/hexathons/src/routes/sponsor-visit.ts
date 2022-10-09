/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery } from "mongoose";

import { SponsorVisitModel, SponsorVisit } from "../models/sponsorVisit";

const getUserCompany = async (req: express.Request) => {
  try {
    const company = await apiCall(
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

    return company;
  } catch (err) {
    throw new BadRequestError("User is not associated with a company");
  }
};

export const sponsorVisitRouter = express.Router();

sponsorVisitRouter.route("/").get(
  checkAbility("read", "Visit"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon is required parameter");
    }

    const company = await getUserCompany(req);

    const filter: FilterQuery<SponsorVisit> = {};
    filter.company = company.id;
    filter.hexathon = req.query.hexathon;

    if (req.query.visitorId) {
      filter.visitorId = String(req.query.visitorId);
    }

    const visits = await SponsorVisitModel.accessibleBy(req.ability).find(filter);
    return res.status(200).send(visits);
  })
);

sponsorVisitRouter.route("/").post(
  checkAbility("create", "Visit"),
  asyncHandler(async (req, res) => {
    if (!req.body.hexathon) {
      throw new BadRequestError("Hexathon is required body field");
    }

    const company = await getUserCompany(req);

    const visit = await SponsorVisitModel.create({
      visitorId: req.body.visitorId,
      hexathon: req.body.hexathon,
      company: company.id,
      employee: req.user?.uid,
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
    const company = await getUserCompany(req);

    const visit = await SponsorVisitModel.findOne({
      _id: req.params.visitId,
      company: company.id,
    });

    if (!visit) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }

    return res.status(200).send(visit);
  })
);

sponsorVisitRouter.route("/:visitId").put(
  checkAbility("update", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await getUserCompany(req);

    const visit = await SponsorVisitModel.findOne({
      _id: req.params.visitId,
      company: company.id,
    });

    if (!visit) {
      throw new BadRequestError("No accessible visit associated with provided visitId");
    }

    const updatedVisit = await visit.update(
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
  checkAbility("delete", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await getUserCompany(req);

    await SponsorVisitModel.findOneAndDelete({
      _id: req.params.visitId,
      company: company.id,
    });

    return res.sendStatus(204);
  })
);
