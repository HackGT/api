import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import multer from "multer";
import { Service } from "@api/config";
import { FilterQuery } from "mongoose";
import { ObjectId } from "mongodb";

import { uploadFile, getFileViewingUrl, uploadFileCDN } from "../common/storage";
import { File, FileModel } from "../models/file";

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
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      userId: req.user?.uid,
      storageId: googleFileName,
      type: req.body.type,
    });

    if (req.body?.type === "resume") {
      await apiCall(
        Service.USERS,
        {
          url: `/users/${req.user?.uid}`,
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

fileRoutes.route("/upload-cdn").post(
  checkAbility("create", "File"),
  multerMid.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError("No file uploaded!");
    }

    const googleFileName = await uploadFileCDN(req.file);

    const file = await FileModel.create({
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      userId: req.user?.uid,
      storageId: googleFileName,
      type: req.body.type,
    });

    res.status(200).json(file);
  })
);

fileRoutes.route("/:id").get(
  checkAbility("read", "File"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<File> = {
      _id: new ObjectId(req.params.id),
    };

    let company;
    try {
      if (req.query.hexathon) {
        company = await apiCall(
          Service.USERS,
          {
            method: "GET",
            url: `/companies/employees/${req.user?.uid}`,
            params: {
              hexathon: req.query.hexathon,
            },
          },
          req
        );
      }
    } catch (err) {
      company = null;
    }

    // If user is not a member and has no associated company, set filter to access only their own applications
    if (!req.user?.roles.member && !company) {
      filter.userId = req.user?.uid;
    }

    const file = await FileModel.findOne(filter);

    res.status(200).send(file);
  })
);

fileRoutes.route("/:id/view").get(
  checkAbility("read", "File"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<File> = {
      _id: new ObjectId(req.params.id),
    };

    let company;
    try {
      if (req.query.hexathon) {
        company = await apiCall(
          Service.USERS,
          {
            method: "GET",
            url: `/companies/employees/${req.user?.uid}`,
            params: {
              hexathon: req.query.hexathon,
            },
          },
          req
        );
      }
    } catch (err) {
      company = null;
    }

    // If user is not a member and has no associated company, set filter to access only their own applications
    if (!req.user?.roles.member && !company) {
      filter.userId = req.user?.uid;
    }

    const file = await FileModel.findOne(filter);

    if (!file || !file.storageId) {
      throw new BadRequestError("You do not have access or invalid file id provided.");
    }

    const fileUrl = await getFileViewingUrl(file);

    res.status(302).redirect(fileUrl);
  })
);
