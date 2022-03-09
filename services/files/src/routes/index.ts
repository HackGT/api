import express from "express";

import { fileRoutes } from "./file";

export const defaultRouter = express.Router();

defaultRouter.use("/files", fileRoutes);
