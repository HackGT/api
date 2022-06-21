import { BadRequestError } from "@api/common";
import express from "express";

import { ItemModel } from "src/models/item";

const itemRoutes = express.Router();

itemRoutes.route("/").get(async (req, res) => {
  try {
    const items = await ItemModel.find({});
    res.send(items);
  } catch (error) {
    throw new BadRequestError("Cannot fetch items");
  }
});

itemRoutes.route("/:itemId").get(async (req, res) => {
  try {
    const item = await ItemModel.findById(req.params.itemId);
    return res.send(item);
  } catch (err) {
    return res.status(500).send({ error: true, message: err });
  }
});

itemRoutes.route("/:itemId").put(async (req, res) => {
  if (true) {
    // TODO: add user authenication
  }
  try {
    const item = await ItemModel.findByIdAndUpdate(req.params.itemId, req.body);
    return res.send(item);
  } catch (err) {
    return res.status(500).send({ error: true, message: err });
  }
});

itemRoutes.route("/").post(async (req, res) => {
  if (true) {
    // TODO: add user authenication
  }
  try {
    await ItemModel.create(req.body);
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send({ error: true, message: err });
  }
});

itemRoutes.route("/:itemId").delete(async (req, res) => {
  if (true) {
    // TODO: add user authenication
  }
  try {
    await ItemModel.findByIdAndDelete(req.params.itemId);
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send({ error: true, message: err });
  }
});
