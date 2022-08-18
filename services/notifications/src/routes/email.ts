import { apiCall, asyncHandler, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { PromisePool } from "@supercharge/promise-pool";

import { NotificationModel, PlatformType } from "src/models/notifications";
import { renderEmail, sendOneMessage, sendOnePersonalizedMessages } from "../plugins/Email";

export const emailRoutes = express.Router();

emailRoutes.route("/render").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    const { message, headerImage } = req.body;

    const [renderedHtml, renderedText] = await renderEmail(message, headerImage);

    res.status(200).json({
      html: renderedHtml,
      text: renderedText,
    });
  })
);

emailRoutes.route("/send").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    const { message, emails, subject, headerImage } = req.body;

    const [renderedHtml, renderedText] = await renderEmail(message, headerImage);

    const { results } = await PromisePool.for(emails)
      .withConcurrency(50)
      .process(async (email: any) => sendOneMessage(email, subject, renderedHtml, renderedText));
    const statuses = Array.isArray(results) ? results : [results];

    await NotificationModel.insertMany(
      statuses.map((status: any) => ({
        ...status,
        platform: PlatformType.EMAIL,
        sender: req.user?.uid,
        timestamp: new Date(),
      }))
    );

    res.status(200).json(statuses);
  })
);

emailRoutes.route("/send-personalized").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    const { message, userIds, subject, headerImage } = req.body;

    const users = await apiCall(
      Service.USERS,
      {
        url: "/users/actions/retrieve",
        method: "POST",
        data: {
          userIds,
        },
      },
      req
    );

    const { results } = await PromisePool.for(userIds)
      .withConcurrency(50)
      .process(async (userId: any) => {
        const userData = users.find((user: any) => user.userId === userId);

        if (!userData) {
          return {
            error: true,
            key: userId,
            payload: "No user found for this userId.",
          };
        }

        return sendOnePersonalizedMessages(message, userData, subject, headerImage);
      });
    const statuses = Array.isArray(results) ? results : [results];

    await NotificationModel.insertMany(
      statuses.map((status: any) => ({
        ...status,
        platform: PlatformType.EMAIL,
        sender: req.user?.uid,
        timestamp: new Date(),
      }))
    );

    res.status(200).json(statuses);
  })
);
