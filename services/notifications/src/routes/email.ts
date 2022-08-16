import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { sendMessages } from "../plugins/Email";

export const emailRoutes = express.Router();

emailRoutes.route("/send").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    const { message, emails, subject, headerImage } = req.body;
    const statuses = await sendMessages(message, emails, subject, headerImage);

    res.status(200).json(statuses);
  })
);
