import express from "express";

import { authRoutes } from "./auth";
import { firebaseUsersRoutes } from "./firebase-users";

export const defaultRouter = express.Router();

defaultRouter.use("/auth", authRoutes);
defaultRouter.use("/firebase-users", firebaseUsersRoutes);
