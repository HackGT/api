import { asyncHandler, isMember } from "@api/common";
import express from "express";

import { sendMessage } from "../plugins/Email";
import { generateErrorMessage } from "../utils/index";
import { EmailConfig } from "../plugins/types";

export const emailRoutes = express.Router();

emailRoutes.use(isMember);

emailRoutes.route("/send").post(
  asyncHandler(async (req, res) => {
    try {
      const { message, emails, subject, headerImage } = req.body;
      await sendMessage(message as string, { subject, emails, headerImage } as EmailConfig);

      res.status(200).json({
        error: false,
        payload: `Message sent to ${emails}!`,
      });
    } catch (error) {
      res.status(400).json({
        error: true,
        payload: generateErrorMessage(error),
      });
    }
  })
);
