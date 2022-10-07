import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { CategoryModel } from "src/models/category";

export const categoryRouter = express.Router();

categoryRouter.route("/").post(
  checkAbility("create", "Category"),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    await CategoryModel.create({ name });

    res.send("Category created");
  })
);
