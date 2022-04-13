import express from "express";

import { applicationRouter } from "./application";
import { branchRouter } from "./branch";

export const defaultRouter = express.Router();

defaultRouter.use("/branches", branchRouter);
defaultRouter.use("/applications", applicationRouter);
