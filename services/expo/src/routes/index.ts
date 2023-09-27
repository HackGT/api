import express from "express";

import { userRoutes } from "./user";
import { projectRoutes } from "./project";
import { assignmentRoutes } from "./assignments";
import { ballotsRoutes } from "./ballots";
import { categoryRoutes } from "./categories";
import { categoryGroupRoutes } from "./categorygroups";
import { configRoutes } from "./config";
import { criteriaRoutes } from "./criteria";
import { rubricRoutes } from "./rubric";
import { tableGroupRoutes } from "./tablegroups";
import { winnerRoutes } from "./winner";

export const defaultRouter = express.Router();

defaultRouter.use("/users", userRoutes);
defaultRouter.use("/projects", projectRoutes);
defaultRouter.use("/categories", categoryRoutes);
defaultRouter.use("/category-groups", categoryGroupRoutes);
defaultRouter.use("/table-groups", tableGroupRoutes);
defaultRouter.use("/config", configRoutes);
defaultRouter.use("/criterias", criteriaRoutes);
defaultRouter.use("/ballots", ballotsRoutes);
defaultRouter.use("/assignments", assignmentRoutes);
defaultRouter.use("/rubrics", rubricRoutes);
defaultRouter.use("/winners", winnerRoutes);
