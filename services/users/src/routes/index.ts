import express from "express";

import { userRoutes } from "./user";
import { companyRoutes } from "./company";

export const defaultRouter = express.Router();

defaultRouter.use("/users", userRoutes);
defaultRouter.use("/companies", companyRoutes);
