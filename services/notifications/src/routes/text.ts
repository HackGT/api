import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { sendMessages } from "../plugins/Twilio";
import { generateErrorMessage } from "../utils/index";

export const textRoutes = express.Router();

textRoutes.route("/send").post(
  checkAbility("manage", "Notification"),
  asyncHandler(async (req, res) => {
    try {
      const { message, numbers } = req.body;
      await sendMessages(message, numbers);

      res.status(200).json({
        error: false,
        payload: `Message sent to ${numbers}!`,
      });
    } catch (error) {
      res.status(400).json({
        error: true,
        payload: generateErrorMessage(error),
      });
    }
  })
);
