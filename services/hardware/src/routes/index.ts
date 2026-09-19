import express from "express";

import { categoryRouter } from "./category";
import { itemRouter } from "./item";
import { locationRouter } from "./location";
import { hardwareRequestRouter } from "./hardware-request";
import { userRoutes } from "./user";
import { hardwareSettingRoutes } from "./hardware-setting";
import { inventoryRouter } from "./inventory";
import { checkoutRouter } from "./checkout";

export const defaultRouter = express.Router();

defaultRouter.use("/items", itemRouter);
defaultRouter.use("/categories", categoryRouter);
defaultRouter.use("/locations", locationRouter);
defaultRouter.use("/hardware-requests", hardwareRequestRouter);
defaultRouter.use("/users", userRoutes);
defaultRouter.use("/hardware-settings", hardwareSettingRoutes);
defaultRouter.use("/inventory", inventoryRouter);
defaultRouter.use("/checkouts", checkoutRouter);
