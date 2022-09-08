/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { VisitModel } from "../models/visit";


export const visitRouter = express.Router();

// get visit
visitRouter.route("/:id").get(
    checkAbility("see", "Visit"),
    asyncHandler(async (req, res) => {

        if (!req.user || !req.user.company) {
            throw new BadRequestError("User must be authenticated employee");
        }
        const visitorId = req.params.id
        const visit = VisitModel.findOne({
            visitorId: visitorId,
            company: req.user.company
        })

        return res.status(200).send(visit.toJSON());
    })
);

// TOOD: post for visit
visitRouter.route("/:id").post(
    asyncHandler(async (req, res) => {
        return res.status(200).send({});
    })
);

