import express from "express";

// import { cartRouter } from "./cart";
import { categoryRouter } from "./category";
import { itemRouter } from "./item";
import { locationRouter } from "./location";
import { hardwareRequestRouter } from "./hardware-request";
import { userRoutes } from "./user";

export const defaultRouter = express.Router();

defaultRouter.use("/items", itemRouter);
defaultRouter.use("/categories", categoryRouter);
defaultRouter.use("/locations", locationRouter);
defaultRouter.use("/hardware-requests", hardwareRequestRouter);
defaultRouter.use("/users", userRoutes);
