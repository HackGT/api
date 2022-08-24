import express from "express";

import { applicationRouter } from "./application";
import { branchRouter } from "./branch";
import { emailRouter } from "./email";
import { gradingRouter } from "./grading";
import { statisticsRouter } from "./statistics";

export const defaultRouter = express.Router();

defaultRouter.use("/branches", branchRouter);
defaultRouter.use("/applications", applicationRouter);
defaultRouter.use("/statistics", statisticsRouter);
defaultRouter.use("/grading", gradingRouter);
defaultRouter.use("/email", emailRouter);
