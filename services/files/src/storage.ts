import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import config from "@api/config";
import path from "path";
import mime from "mime-types";
import { ObjectId } from "mongodb";

import { FileModel, File } from "./models/file";
import { Status } from "./types";

const storage = new Storage({
  projectId: "hexlabs-cloud",
  keyFilename: config.services.FILES.gcp?.serviceKeyPath,
});

const bucket = storage.bucket("hexlabs-api-files");

export const uploadFile = async (
  filePath: string,
  name: string,
  userId: string
): Promise<Status> => {
  try {
    const fileName = path.parse(path.basename(filePath)).name;
    const mimeType = mime.lookup(filePath);
    const googleFileName = `${fileName}_${Date.now()}`;
    const file = bucket.file(googleFileName);

    await bucket.upload(filePath, {
      destination: googleFileName,
    });

    await file.setMetadata({
      contentType: mimeType,
    });

    const { id } = await FileModel.create({
      fileName,
      mimeType,
      userId,
      storageId: googleFileName,
    });

    await file.makePublic();

    return {
      error: false,
      payload: id,
    };
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) message = err.message;
    throw new Error(message);
  }
};

export const getFileUrl = async (mongoId: string): Promise<Status> => {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  const file = await FileModel.findOne({ _id: new ObjectId(mongoId) });

  if (!file || !file.storageId) {
    throw new Error("File not found!");
  }

  const [url] = await bucket.file(file?.storageId).getSignedUrl(options);

  return {
    error: false,
    payload: url,
  };
};

export const getDownloadUrl = async (mongoId: string): Promise<Status> => {
  const file = await FileModel.findOne({ _id: new ObjectId(mongoId) });

  if (!file || !file.storageId) {
    throw new Error("File not found!");
  }

  const metaData = await bucket.file(file.storageId).getMetadata();
  return {
    error: false,
    payload: metaData[0].mediaLink,
  };
};
