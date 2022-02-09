import express from "express";

import { branchRouter } from "./branch";

export const defaultRouter = express.Router();

defaultRouter.use("/", branchRouter);
