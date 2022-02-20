import { asyncHandler } from "@api/common";
import express from "express";

import { ApplicationModel } from "../models/application";

export const applicationRouter = express.Router();

applicationRouter.route("/").get(
    asyncHandler(async (req, res) => {
        const applications = await ApplicationModel.find({});

        return res.send(applications);
    })
);

applicationRouter.route("/:id").get(
    asyncHandler(async (req, res) => {
        const application = await ApplicationModel.find({ _id: req.query.id });

        return res.send(application);
    })
);

applicationRouter.route("/").post(
    asyncHandler(async (req, res) => {
        const newApplication = await ApplicationModel.create({
            user: req.body.user,
            event: req.body.event,
            applicationBranch: req.body.applicationBranch,
            applicationData: req.body.applicationData,
            applicationStartTime: req.body.appplicationStartTime,
            applicationSubmitTime: req.body.appplicationSubmitTime,
            confirmationBranch: req.body.confirmationBranch,
            confirmationData: req.body.confirmationData,
            confirmationStartTime: req.body.appplicationStartTime,
            confirmationSubmitTime: req.body.appplicationSubmitTime
        })

        return res.send(newApplication);
    })
);

applicationRouter.route("/:id").patch(
    asyncHandler(async (req, res) => {
        const updatedApplication = await ApplicationModel.findByIdAndUpdate(
            req.params.id,
            {
                user: req.body.user,
                event: req.body.event,
                applicationBranch: req.body.applicationBranch,
                applicationData: req.body.applicationData,
                applicationStartTime: req.body.appplicationStartTime,
                applicationSubmitTime: req.body.appplicationSubmitTime,
                confirmationBranch: req.body.confirmationBranch,
                confirmationData: req.body.confirmationData,
                confirmationStartTime: req.body.appplicationStartTime,
                confirmationSubmitTime: req.body.appplicationSubmitTime
            },
            { new: true }
        )

        return res.send(updatedApplication);
    })
);



