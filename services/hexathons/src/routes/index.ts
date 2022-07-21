import express from "express";

import { hexathonRouter } from "./hexathon";
import { interactionRoutes } from "./interaction";

export const defaultRouter = express.Router();

defaultRouter.use("/hexathons", hexathonRouter);
defaultRouter.use("/interactions", interactionRoutes);
