import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import config from "@api/config";
import path from "path";
import { BadRequestError } from "@api/common";

import { FileModel } from "./models/file";

const storage = new Storage();

const bucket = storage.bucket(config.services.FILES.storageBucket || "");

export const uploadFile = async (
  file: Express.Multer.File,
  userId: string,
  fileType: string
): Promise<string> => {
  const { originalname, buffer } = file;

  const googleFileName = `${path.parse(originalname).name}_${Date.now()}`;
  const blob = bucket.file(googleFileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
  });

  const { id } = await FileModel.create({
    fileName: path.parse(originalname).name,
    mimeType: file.mimetype,
    userId,
    storageId: googleFileName,
    type: fileType,
  });

  blobStream
    .on("finish", async () => {
      await blob.makePublic();
      await blob.setMetadata({
        contentType: file.mimetype,
      });
    })
    .on("error", err => {
      throw new Error(err.message);
    })
    .end(buffer);

  return id;
};

export const getFileUrl = async (mongoId: string): Promise<string> => {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  const file = await FileModel.findById(mongoId);

  if (!file || !file.storageId) {
    throw new BadRequestError("File not found!");
  }

  const [url] = await bucket.file(file?.storageId).getSignedUrl(options);

  return url;
};

export const getDownloadUrl = async (mongoId: string): Promise<string> => {
  const file = await FileModel.findById(mongoId);

  if (!file || !file.storageId) {
    throw new BadRequestError("File not found!");
  }

  const metaData = await bucket.file(file.storageId).getMetadata();
  return metaData[0].mediaLink;
};
