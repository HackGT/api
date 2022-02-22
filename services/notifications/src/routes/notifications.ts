import { asyncHandler } from "@api/common";
import express from "express";

import { sendOneMessage } from "../plugins/Twilio";
import { generateErrorMessage } from "../utils/index";

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

notificationsRoutes.route("/text/send").post(
  asyncHandler(async (req, res) => {
    try {
      const { message, number } = req.body;
      await sendOneMessage(message as string, number as string);
      res.status(200).json({
        error: false,
        payload: `Message sent to ${number}!`,
      });
    } catch (error) {
      res.status(400).json({
        error: true,
        payload: generateErrorMessage(error),
      });
    }
  })
);
