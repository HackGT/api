import express from "express";

import { profileRoutes } from "./profile";
import { userRoutes } from "./user";

export const defaultRouter = express.Router();

defaultRouter.use("/", userRoutes);
defaultRouter.use("/:userId/profile", profileRoutes);
