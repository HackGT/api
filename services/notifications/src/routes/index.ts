import express from "express";

import { textRoutes } from "./text";

export const defaultRouter = express.Router();

defaultRouter.use("/text", textRoutes);
