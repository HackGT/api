import { asyncHandler } from "@api/common";
import { EmailConfig, EmailPlugin } from "../plugins/Email"
import express from "express";

export const notificationsRoutes = express.Router();

notificationsRoutes.route("/").get(asyncHandler(async (req, res) => res.send()));

notificationsRoutes.route("/").post(asyncHandler(async (req, res) => res.send()));

notificationsRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

notificationsRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    res.send();
  })
);

notificationsRoutes.route("/email/send").post(
  asyncHandler(async (req, res) => {
    let email: EmailPlugin = new EmailPlugin();

    function createEmailConfig(config: EmailConfig): { subject: string; emails: string[]; headerImage?: string; } {
      return {
        subject: config.subject,
        emails: config.emails,
        headerImage: config.headerImage
      }
    }

    return email.sendMessage(req.body.message, createEmailConfig({ subject: req.body.subject, emails: req.body.emails, headerImage: req.body.headerImage }))
  })
)
