/* eslint-disable no-underscore-dangle */
import { asyncHandler } from "@api/common";
import express from "express";

import { ApplicationModel } from "../models/application";
import { BranchModel, BranchType } from "../models/branch";

export const statisticsRouter = express.Router();

statisticsRouter.route("/users").get(
  asyncHandler(async (req, res) => {
    // from the status field, get applied, accepted, confirmed and non-confirmed users
  })
);
