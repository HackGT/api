import express from "express";

import { userRoutes } from "./user";

export const defaultRouter = express.Router();

defaultRouter.use("/user", userRoutes);
