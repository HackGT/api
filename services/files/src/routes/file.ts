import { asyncHandler } from "@api/common";
import express from "express";

import { FileModel } from "../models/file";

export const fileRoutes = express.Router();
