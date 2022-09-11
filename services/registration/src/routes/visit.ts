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

        if (!req.user || !req.user.company) {
            throw new BadRequestError("User must be authenticated employee");
        }
        const visitorId = req.params.visitorId
        const visit = VisitModel.findOne({
            visitorId: visitorId,
            company: req.user.company
        })

        return res.status(200).send(visit.toJSON());
    })
);

visitRouter.route("/:companyId/:visitorId").post(
    checkAbility("create", "Visit"),
    asyncHandler(async (req, res) => {

        const visit = await VisitModel.create({
            visitorId: req.params.visitorId,
            hexathon: req.body.hexathon,
            company: req.params.companyId,
            employees: req.body.employees,
            tags: req.body.tags, 
            notes: req.body.notes, 
            time: new Date(),
          });
        res.send(visit)
    })
);

visitRouter.route("/:companyId/:visitorId").put(
    checkAbility("update", "Visit"),
    asyncHandler(async (req, res) => {

        const visit = await VisitModel.findOne({
            visitorId: req.params.visitorId,
            company: req.params.companyId,
          });
        
        let newTags = visit.tags
        let addEmployees = visit.employees

        if (req.body.tags) {
            for (const tag of req.body.tags) {
                if (!newTags.includes(tag)) {
                    newTags.push(tag)
                  }
            }
        }

        if (req.body.employees) {
            for (const emp of req.body.employees) {
                if (!addEmployees.includes(emp)) {
                    addEmployees.push(emp)
                  }
            }
        }
        
        const newVisit = await VisitModel.findOneAndUpdate({
            visitorId: req.params.visitorId,
            company: req.params.companyId,
          }, {
            tags: newTags, 
            notes: visit.notes.concat(req.body.notes), 
            employees: addEmployees,

          });
        res.send(newVisit)
    })
);
