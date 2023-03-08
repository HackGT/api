import express from "express";

import { hexathonRouter } from "./hexathon";
import { interactionRoutes } from "./interaction";
import { eventRoutes } from "./event";
import { locationRoutes } from "./location";
import { tagRoutes } from "./tag";
import { checkinRouter } from "./checkin";
import { hexathonUserRouter } from "./hexathon-users";
import { swagItemRouter } from "./swag-item";
import { sponsorVisitRouter } from "./sponsor-visit";
import { blockRoutes } from "./block";

export const defaultRouter = express.Router();

defaultRouter.use("/hexathons", hexathonRouter);
defaultRouter.use("/interactions", interactionRoutes);
defaultRouter.use("/events", eventRoutes);
defaultRouter.use("/locations", locationRoutes);
defaultRouter.use("/tags", tagRoutes);
defaultRouter.use("/checkin", checkinRouter);
defaultRouter.use("/hexathon-users", hexathonUserRouter);
defaultRouter.use("/swag-items", swagItemRouter);
defaultRouter.use("/sponsor-visit", sponsorVisitRouter);
defaultRouter.use("/blocks", blockRoutes);
