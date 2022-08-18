import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import config from "@api/config";
import path from "path";

import { File } from "../models/file";

const storage = new Storage();

const bucket = storage.bucket(config.services.FILES.storageBucket || "");

export const uploadFile = async (file: Express.Multer.File) => {
  const { originalname, buffer } = file;

  const googleFileName = `${path.parse(originalname).name}_${Date.now()}`;
  const blob = bucket.file(googleFileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
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

  return googleFileName;
};

export const getFileViewingUrl = async (file: File): Promise<string> => {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  const [url] = await bucket.file(file?.storageId).getSignedUrl(options);
  return url;
};