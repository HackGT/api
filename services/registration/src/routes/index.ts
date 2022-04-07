import express from "express";

import { applicationRouter } from "./application";
import { branchRouter } from "./branch";

export const defaultRouter = express.Router();

defaultRouter.use("/branch", branchRouter);
defaultRouter.use("/application", applicationRouter);
