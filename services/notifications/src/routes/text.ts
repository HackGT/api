import { asyncHandler } from "@api/common";
import express from "express";

import { sendMessages } from "../plugins/Twilio";
import { generateErrorMessage } from "../utils/index";
import { TwilioConfig } from "../plugins/types";

export const textRoutes = express.Router();

textRoutes.route("/send").post(
  asyncHandler(async (req, res) => {
    try {
      const { message, numbers } = req.body;
      await sendMessages(message as string, { numbers } as TwilioConfig);

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
