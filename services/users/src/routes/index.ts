import express from "express";

import { userRoutes } from "./user";
import { teamRoutes } from "./team";
import { companyRoutes } from "./company";

export const defaultRouter = express.Router();

defaultRouter.use("/users", userRoutes);
defaultRouter.use("/teams", teamRoutes);
defaultRouter.use("/companies", companyRoutes);
