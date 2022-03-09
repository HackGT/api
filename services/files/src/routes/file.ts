import { asyncHandler } from "@api/common";
import express from "express";

import { uploadFile, getFileUrl, getDownloadUrl } from "src/storage";

export const fileRoutes = express.Router();

fileRoutes.route("/files/upload").post(
  asyncHandler(async (req, res) => {
    const { file } = req;
    const { userId } = req.body;

    if (!userId) {
      throw new Error("UserId is required!");
    }

    if (!file) {
      throw new Error("No file uploaded!");
    }

    const payload = await uploadFile(file, userId);
    res.status(200).json({ message: "File successfully uploaded", fileUrl: payload });
  })
);

fileRoutes.route("/files/:id").get(
  asyncHandler(async (req, res) => {
    const mongoId = req.params.id;

    const fileUrl = await getFileUrl(mongoId);

    res.status(200).send(fileUrl);
  })
);

fileRoutes.route("/files/download/:id").get(
  asyncHandler(async (req, res) => {
    const mongoId = req.params.id;
    const downloadLink = await getDownloadUrl(mongoId);
    res.status(200).send(downloadLink);
  })
);
