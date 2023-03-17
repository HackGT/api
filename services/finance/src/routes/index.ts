import express from "express";

import { budgetRoutes } from "./budget";
import { projectRoutes } from "./project";
import { requisitionRoutes } from "./requisition";
import { userRoutes } from "./user";
import { vendorRoutes } from "./vendor";
import { paymentMethodRoutes } from "./paymentMethod";

export const defaultRouter = express.Router();

defaultRouter.use("/user", userRoutes);
defaultRouter.use("/projects", projectRoutes);
defaultRouter.use("/budgets", budgetRoutes);
defaultRouter.use("/payment-methods", paymentMethodRoutes);
defaultRouter.use("/requisitions", requisitionRoutes);
defaultRouter.use("/vendors", vendorRoutes);
