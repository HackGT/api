import express from "express";

import { profileRoutes } from "./profile";

export const defaultRouter = express.Router();

defaultRouter.use("/", profileRoutes);
