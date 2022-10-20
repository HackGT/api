import express from "express";

import { userRoutes } from "./user";
import { projectRoutes } from "./project";
import { assignmentRoutes } from "./assignments";
import { ballotsRoutes } from "./ballots";
import { categoryRoutes } from "./categories";
import { categoryGroupRoutes } from "./categorygroups";
import { configRoutes } from "./config";
import { criteriaRoutes } from "./criteria";
// import { hackathonRoutes } from "./hackathon";
import { rubricRoutes } from "./rubric";
import { tableGroupRoutes } from "./tablegroups";
import { winnerRoutes } from "./winner";
import { app } from "../app";

export const defaultRouter = express.Router();

defaultRouter.use("/user", userRoutes);
defaultRouter.use("/projects", projectRoutes);
defaultRouter.use("/categories", categoryRoutes);
defaultRouter.use("/categorygroups", categoryGroupRoutes);
defaultRouter.use("/tablegroups", tableGroupRoutes);
defaultRouter.use("/config", configRoutes);
defaultRouter.use("/criteria", criteriaRoutes);
defaultRouter.use("/ballots", ballotsRoutes);
defaultRouter.use("/assignments", assignmentRoutes);
defaultRouter.use("/rubric", rubricRoutes);
defaultRouter.use("/winner", winnerRoutes);
