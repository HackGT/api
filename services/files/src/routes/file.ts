import { asyncHandler, BadRequestError } from "@api/common";
import express from "express";

import { uploadFile, getFileUrl, getDownloadUrl } from "src/storage";

export const fileRoutes = express.Router();

fileRoutes.route("/upload").post(
  asyncHandler(async (req, res) => {
    const { file } = req;

    if (!req.user) {
      throw new BadRequestError("User must be logged in");
    }

    if (!file) {
      throw new BadRequestError("No file uploaded!");
    }

    const id = await uploadFile(file, req.user.uid);
    res.status(200).json({ id, message: "File successfully uploaded" });
  })
);

fileRoutes.route("/:id").get(
  asyncHandler(async (req, res) => {
    const fileUrl = await getFileUrl(req.params.id);

    res.status(200).send(fileUrl);
  })
);

fileRoutes.route("/:id/download").get(
  asyncHandler(async (req, res) => {
    const downloadLink = await getDownloadUrl(req.params.id);

    res.status(200).send(downloadLink);
  })
);
