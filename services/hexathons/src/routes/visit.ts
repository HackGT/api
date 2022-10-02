/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery } from "mongoose";

import { VisitModel, Visit } from "../models/visit";

export const sponsorVisitRouter = express.Router();

// get visit
sponsorVisitRouter.route("/").get(
  checkAbility("read", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!company) {
      throw new BadRequestError("Current user not associated with a company");
    }

    const filter: FilterQuery<Visit> = {};
    filter.company = String(company.id);
    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }
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
    // get company of current user
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!company) {
      throw new BadRequestError("Current user not associated with a company");
    }

    const visitor = await apiCall(
      Service.USERS,
      { method: "GET", url: `/users/${req.body?.visitorId}` },
      req
    );

    const hexathon = await apiCall(
      Service.HEXATHONS,
      { method: "GET", url: `/hexathons/${req.body.hexathon}` },
      req
    );

    if (!visitor || !hexathon) {
      throw new BadRequestError(
        "Visit creation must be associated with a valid visitor and hexathon"
      );
    }

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < req.body.employees.length; i++) {
      const emp = await apiCall(
        Service.USERS,
        { method: "GET", url: `/users/${req.body.employees[i]}` },
        req
      );

      const empCompany = await apiCall(
        Service.USERS,
        { method: "GET", url: `/companies/employees/${req.body.employees[i]}` },
        req
      );

      if (!emp || empCompany.name !== company.name) {
        throw new BadRequestError(
          "Included employeeId not associated with a valid employee of the company"
        );
      }
    }
    /* eslint-enable no-await-in-loop */

    const visit = await VisitModel.create({
      visitorId: req.body.visitorId,
      hexathon: req.body.hexathon,
      company: company.id,
      employees: req.body.employees,
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
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!company) {
      throw new BadRequestError("Current user not associated with a company");
    }

    const { visitId } = req.params;
    const visit = await VisitModel.findOne({
      _id: visitId,
      company: company.id,
    });

    if (!visit) {
      throw new BadRequestError("No visit associated with provided visitId");
    }

    return res.status(200).send(visit?.toJSON());
  })
);

sponsorVisitRouter.route("/:visitId").put(
  checkAbility("update", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!company) {
      throw new BadRequestError("Current user not associated with a company");
    }

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < req.body.employees.length; i++) {
      const emp = await apiCall(
        Service.USERS,
        { method: "GET", url: `/users/${req.body.employees[i]}` },
        req
      );

      const empCompany = await apiCall(
        Service.USERS,
        { method: "GET", url: `/companies/employees/${req.body.employees[i]}` },
        req
      );

      if (!emp || empCompany.name !== company.name) {
        throw new BadRequestError(
          "Included employeeId not associated with a valid employee of the company"
        );
      }
    }
    /* eslint-enable no-await-in-loop */

    const newVisit = await VisitModel.findOneAndUpdate(
      {
        _id: req.params.visitId,
        company: company.id,
      },
      {
        tags: req.body.tags,
        notes: req.body.notes,
        employees: req.body.employees,
      },
      { new: true }
    );
    return res.status(200).send(newVisit?.toJSON());
  })
);

sponsorVisitRouter.route("/:visitId").delete(
  checkAbility("update", "Visit"),
  asyncHandler(async (req, res) => {
    const company = await apiCall(
      Service.USERS,
      { method: "GET", url: `/companies/employees/${req.user?.uid}` },
      req
    );

    if (!company) {
      throw new BadRequestError("Current user not associated with a company");
    }

    await VisitModel.findByIdAndDelete(req.params.visitId);
    return res.sendStatus(204);
  })
);
