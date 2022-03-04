import { asyncHandler } from "@api/common";
import express from "express";

import { uploadFile, getFileUrl, getDownloadUrl } from "src/storage";
import { FileModel } from "../models/file";

export const fileRoutes = express.Router();

fileRoutes.route("/").get(asyncHandler(async (req, res) => res.send()));

fileRoutes.route("/").post(asyncHandler(async (req, res) => res.send()));

fileRoutes.route("/files/upload").post(
  asyncHandler(async (req, res) => {
    try {
      const { filePath, name, userId } = req.body;

      const { payload } = await uploadFile(filePath, name, userId);
      res.status(200).send(`File ${payload} uploaded!`);
    } catch (error) {
      let message = "Unknown error";
      if (error instanceof Error) message = error.message;
      res.status(400).send(message);
    }
  })
);

fileRoutes.route("/files/:id").get(
  asyncHandler(async (req, res) => {
    try {
      const mongoId = req.params.id;

      const fileUrl = await getFileUrl(mongoId);

      res.status(200).send(fileUrl);
    } catch (error) {
      let message = "Unknown error";
      if (error instanceof Error) message = error.message;
      res.status(400).send(message);
    }
  })
);

fileRoutes.route("/files/download/:id").get(
  asyncHandler(async (req, res) => {
    const mongoId = req.params.id;
    const downloadLink = await getDownloadUrl(mongoId);
    res.status(200).send(downloadLink);
  })
);
