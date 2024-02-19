import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import multer from "multer";
import config, { Service } from "@api/config";
import { FilterQuery } from "mongoose";
import { ObjectId } from "mongodb";

import { uploadFile, uploadFiles, getFileViewingUrl } from "../common/storage";
import { File, FileModel } from "../models/file";

const fileMimeTypesAllowlist = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "text/plain",
];

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    // no larger than 5mb.
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!fileMimeTypesAllowlist.includes(file.mimetype)) {
      callback(new Error("Invalid file format"));
      return;
    }
    callback(null, true);
  },
});

export const fileRoutes = express.Router();

fileRoutes.route("/upload/:folder?").post(
  checkAbility("create", "File"),
  multerMid.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    const googleFileName = await uploadFile(
      req.file,
      config.common.googleCloud.storageBuckets.default,
      req.params.folder
    );

    const file = await FileModel.create({
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      userId: req.user?.uid,
      storageId: googleFileName,
      storageBucket: config.common.googleCloud.storageBuckets.default,
      type: req.body.type,
    });

    if (req.body.type === "resume") {
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
    if (!req.user?.roles.member) {
      throw new BadRequestError("You do not have access to upload files");
    }
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    const googleFileName = await uploadFile(
      req.file,
      config.common.googleCloud.storageBuckets.publicCDN
    );

    const file = await FileModel.create({
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      userId: req.user?.uid,
      storageId: googleFileName,
      storageBucket: config.common.googleCloud.storageBuckets.publicCDN,
      type: req.body.type,
    });

    res.status(200).json(file);
  })
);

fileRoutes.route("/upload-finance").post(
  checkAbility("create", "File"),
  multerMid.array("files", 10),
  asyncHandler(async (req, res) => {
    if (!req.user?.roles.member) {
      throw new BadRequestError("You do not have access to upload files");
    }
    if (!req.files || req.files.length === 0) {
      throw new BadRequestError("No files uploaded");
    }

    const googleFileNames = await uploadFiles(
      req.files as Express.Multer.File[],
      config.common.googleCloud.storageBuckets.finance
    );

    if (googleFileNames.length !== req.files.length) {
      throw new BadRequestError("Error or mismatch uploading files");
    }

    const createFilesData = (req.files as Express.Multer.File[]).map((file, index) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      userId: req.user?.uid,
      storageId: googleFileNames[index],
      storageBucket: config.common.googleCloud.storageBuckets.finance,
      type: "finance",
    }));
    const files = await FileModel.create(createFilesData);

    res.status(200).json(files);
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

fileRoutes.route("/actions/retrieve").post(
  checkAbility("read", "File"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<File> = {
      _id: {
        $in: req.body.fileIds.map((fileId: any) => new ObjectId(fileId)),
      },
    };
    if (!req.user?.roles.member) {
      filter.userId = req.user?.uid;
    }

    const files = await FileModel.find(filter);

    res.status(200).send(files);
  })
);
