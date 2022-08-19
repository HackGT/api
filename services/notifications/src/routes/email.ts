import { apiCall, asyncHandler, checkAbility } from "@api/common";
import config, { Service } from "@api/config";
import express from "express";
import { PromisePool } from "@supercharge/promise-pool";
import axios from "axios";

import { NotificationModel, PlatformType } from "../models/notifications";
import { renderEmail, sendOneMessage, sendOnePersonalizedMessages } from "../plugins/Email";

const mailerLiteApiKey = config.services.NOTIFICATIONS.pluginConfig?.email.mailerLiteApiKey || "";

export const emailRoutes = express.Router();

emailRoutes.route("/render").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    let headerImage: any;
    if (req.body.hexathon) {
      const hexathon = await apiCall(
        Service.HEXATHONS,
        {
          url: `/hexathons/${req.body.hexathon}`,
          method: "GET",
        },
        req
      );
      headerImage = hexathon.emailHeaderImage;
    }

    const [renderedHtml, renderedText] = await renderEmail(req.body.message, headerImage);

    res.status(200).json({
      html: renderedHtml,
      text: renderedText,
    });
  })
);

emailRoutes.route("/send").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    const { message, emails, subject } = req.body;

    let headerImage: any;
    if (req.body.hexathon) {
      const hexathon = await apiCall(
        Service.HEXATHONS,
        {
          url: `/hexathons/${req.body.hexathon}`,
          method: "GET",
        },
        req
      );
      headerImage = hexathon.emailHeaderImage;
    }

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
    const { message, userIds, subject } = req.body;

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

    let headerImage: any;
    if (req.body.hexathon) {
      const hexathon = await apiCall(
        Service.HEXATHONS,
        {
          url: `/hexathons/${req.body.hexathon}`,
          method: "GET",
        },
        req
      );
      headerImage = hexathon.emailHeaderImage;
    }

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

// Route endpoint can be changed
emailRoutes.route("/new-subscriber/:email").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    if (mailerLiteApiKey === "") {
      // throw error
    }

    if (req.params.email) {
      const options: any = {
        method: "POST",
        url: "https://api.mailerlite.com/api/v2/subscribers",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-MailerLite-ApiKey": mailerLiteApiKey,
        },
        data: { email: req.params.email, resubscribe: false, type: "null" },
      };

      axios
        .request(options)
        .then(response => {
          console.log(response.data);
          res.status(200).json(response.data);
        })
        .catch(error => {
          console.error(error);
          res.status(200).json(error);
        });
    }

    res.status(200).json();
  })
);
