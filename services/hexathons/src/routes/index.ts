import express from "express";

import { hexathonRouter } from "./hexathon";

export const defaultRouter = express.Router();

defaultRouter.use("/hexathons", hexathonRouter);
