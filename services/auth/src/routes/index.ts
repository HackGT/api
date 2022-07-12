import express from "express";

import { authRoutes } from "./auth";
import { firebaseUsersRoutes } from "./firebase-users";
import { permissionRoutes } from "./permission";

export const defaultRouter = express.Router();

defaultRouter.use("/auth", authRoutes);
defaultRouter.use("/firebase-users", firebaseUsersRoutes);
defaultRouter.use("/permissions", permissionRoutes);
