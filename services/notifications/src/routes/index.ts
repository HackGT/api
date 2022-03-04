import express from "express";

import { textRoutes } from "./text";
import { emailRoutes } from "./email";

export const defaultRouter = express.Router();

defaultRouter.use("/text", textRoutes);
defaultRouter.use("/email", emailRoutes);
