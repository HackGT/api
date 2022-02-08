import express from "express";

import { eventRouter } from "./event";

export const defaultRouter = express.Router();

defaultRouter.use("/", eventRouter);
