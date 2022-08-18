import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { sendMessages } from "../plugins/Twilio";

export const textRoutes = express.Router();

textRoutes.route("/send").post(
  checkAbility("create", "Text"),
  asyncHandler(async (req, res) => {
    const { message, numbers } = req.body;
    const statuses = await sendMessages(message, numbers);

    res.status(200).json(statuses);
  })
);
