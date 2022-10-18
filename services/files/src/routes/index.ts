import express from "express";

import { fileRoutes } from "./file";
import { jobsRoutes } from "./jobs";

export const defaultRouter = express.Router();

defaultRouter.use("/files", fileRoutes);
defaultRouter.use("/jobs", jobsRoutes);
