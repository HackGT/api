import express from "express";

import { notificationsRoutes } from "./notifications";

export const defaultRouter = express.Router();

defaultRouter.use("/", notificationsRoutes);
