import express from "express";

import { checkinRouter } from "./checkin";

export const defaultRouter = express.Router();

defaultRouter.use("/checkin", checkinRouter);
