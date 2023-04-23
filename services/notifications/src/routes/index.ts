import express from "express";

import { textRoutes } from "./text";
import { emailRoutes } from "./email";
import { slackRoutes } from "./slack";

export const defaultRouter = express.Router();

defaultRouter.use("/text", textRoutes);
defaultRouter.use("/email", emailRoutes);
defaultRouter.use("/slack", slackRoutes);
