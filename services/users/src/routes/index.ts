import express from "express";

import { authRoutes } from "./auth";
import { userRoutes } from "./user";
import { teamRoutes } from "./team";
import { companyRoutes } from "./company";

export const defaultRouter = express.Router();

defaultRouter.use("/auth", authRoutes);
defaultRouter.use("/users", userRoutes);
defaultRouter.use("/teams", teamRoutes);
defaultRouter.use("/companies", companyRoutes);
