import express from "express";

import { profileRoutes } from "./profile";
import { authRoutes } from "./auth";
import { userRoutes } from "./user";

export const defaultRouter = express.Router();

defaultRouter.use("/auth", authRoutes);
defaultRouter.use("/users/:userId/profile", profileRoutes);
defaultRouter.use("/users", userRoutes);
