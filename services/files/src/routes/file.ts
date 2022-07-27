import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import multer from "multer";
import { Service } from "@api/config";
import path from "path";

import { uploadFile, getFileUrl, getDownloadUrl } from "../storage";
import { FileModel } from "../models/file";

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    // no larger than 5mb.
    fileSize: 5 * 1024 * 1024,
  },
});

export const fileRoutes = express.Router();

fileRoutes.route("/upload").post(
  checkAbility("create", "File"),
  multerMid.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError("No file uploaded!");
    }

    const googleFileName = await uploadFile(req.file);

    const file = await FileModel.create({
      name: path.parse(req.file.originalname).name,
      mimeType: req.file.mimetype,
      userId: req.user?.uid,
      storageId: googleFileName,
      type: req.body.type,
    });

    if (req.body?.type === "resume") {
      apiCall(
        Service.USERS,
        {
          url: `/users/${req.user?.uid}/profile`,
          method: "PUT",
          data: {
            resume: file.id,
          },
        },
        req
      );
    }

    res.status(200).json(file);
  })
);

fileRoutes.route("/:id").get(
  checkAbility("read", "File"),
  asyncHandler(async (req, res) => {
    const file = await FileModel.findById(req.params.id).accessibleBy(req.ability);

    res.status(200).send(file);
  })
);

fileRoutes.route("/:id/signed-url").get(
  checkAbility("read", "File"),
  asyncHandler(async (req, res) => {
    const file = await FileModel.findById(req.params.id).accessibleBy(req.ability);

    if (!file || !file.storageId) {
      throw new BadRequestError("You do not have access or invalid file id provided.");
    }

    const fileUrl = await getFileUrl(file);

    res.status(200).send(fileUrl);
  })
);

fileRoutes.route("/:id/download").get(
  checkAbility("read", "File"),
  asyncHandler(async (req, res) => {
    const file = await FileModel.findById(req.params.id).accessibleBy(req.ability);

    if (!file || !file.storageId) {
      throw new BadRequestError("You do not have access or invalid file id provided.");
    }

    const downloadLink = await getDownloadUrl(file);

    res.status(200).send(downloadLink);
  })
);
