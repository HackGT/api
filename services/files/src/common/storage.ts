import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import config from "@api/config";
import path from "path";
import { BadRequestError } from "@api/common";

import { File } from "../models/file";

const storage = new Storage();

export const uploadFile = async (file: Express.Multer.File, bucketName: string) => {
  const { originalname, buffer } = file;
  const googleFileName = `${path.parse(originalname).name}_${Date.now()}`;
  const blob = storage.bucket(bucketName).file(googleFileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
  });

  blobStream
    .on("finish", async () => {
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

export const uploadFiles = async (files: Express.Multer.File[], bucketName: string) => {
  const googleFileNames: string[] = [];
  const fileUploadStreams: Promise<any>[] = [];

  files.forEach(file => {
    const { originalname, buffer } = file;
    const googleFileName = `${path.parse(originalname).name}_${Date.now()}`;
    googleFileNames.push(googleFileName);
    const blob = storage.bucket(bucketName).file(googleFileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        contentType: file.mimetype,
      },
    });

    fileUploadStreams.push(
      new Promise<any>((resolve, reject) => {
        blobStream
          .on("finish", () => resolve(true))
          .on("error", () => reject(false)) // eslint-disable-line prefer-promise-reject-errors
          .end(buffer);
      })
    );
  });

  const uploadResults: boolean[] = await Promise.all(fileUploadStreams);
  if (!uploadResults.every(success => success === true)) {
    throw new BadRequestError("Files could not be uploaded");
  }

  return googleFileNames;
};

export const getFileViewingUrl = async (file: File): Promise<string> => {
  const bucket = storage.bucket(
    file.storageBucket || config.common.googleCloud.storageBuckets.default
  );
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };
  const [url] = await bucket.file(file.storageId).getSignedUrl(options);
  return url;
};
