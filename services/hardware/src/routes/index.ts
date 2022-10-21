import express from "express";

// import { cartRouter } from "./cart";
import { categoryRouter } from "./category";
import { itemRouter } from "./item";
import { locationRouter } from "./location";
import { hardwareRequestRouter } from "./hardware-request";

export const defaultRouter = express.Router();

defaultRouter.use("/items", itemRouter);
defaultRouter.use("/categories", categoryRouter);
defaultRouter.use("/locations", locationRouter);
defaultRouter.use("/hardware-requests", hardwareRequestRouter);
