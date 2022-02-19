import express from "express";

import { interactionRoutes } from "./interaction";

export const defaultRouter = express.Router();

defaultRouter.use("/", interactionRoutes);
