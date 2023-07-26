import express from "express";

import { authRoutes } from "./auth";
import { permissionRoutes } from "./permission";

export const defaultRouter = express.Router();

defaultRouter.use("/auth", authRoutes);
defaultRouter.use("/permissions", permissionRoutes);
