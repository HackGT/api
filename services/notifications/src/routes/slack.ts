import { asyncHandler } from "@api/common";
import express from "express";
import { WebClient } from "@slack/web-api";

export const slackRoutes = express.Router();

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
// const CHANNEL_ID = "C04SCD2AVDG";

slackRoutes.route("/announcements/:channelId").get(
  asyncHandler(async (req, res) => {
    try {
      const response = await client.conversations.history({
        channel: req.params.channelId,
      });
      const messageText = response.messages?.map(message => message.text);
      const announcements = messageText?.filter(
        message =>
          !message?.includes("has joined the channel") &&
          !message?.includes("has renamed the channel")
      );
      return res.json(announcements);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
);
