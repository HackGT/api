import express from "express";

import { authRoutes } from "./auth";

export const defaultRouter = express.Router();

defaultRouter.use("/auth", authRoutes);
