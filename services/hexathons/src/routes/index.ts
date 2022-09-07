import express from "express";

import { hexathonRouter } from "./hexathon";
import { interactionRoutes } from "./interaction";
import { checkinRouter } from "./checkin";
import { hexathonUserRouter } from "./hexathon-users";
import { prizeItemRouter } from "./prize-item";

export const defaultRouter = express.Router();

defaultRouter.use("/hexathons", hexathonRouter);
defaultRouter.use("/interactions", interactionRoutes);
defaultRouter.use("/checkin", checkinRouter);
defaultRouter.use("/hexathon-users", hexathonUserRouter);
defaultRouter.use("/prize-items", prizeItemRouter);
