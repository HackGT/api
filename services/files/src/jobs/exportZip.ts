import archiver from "archiver";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Storage } from "@google-cloud/storage";
import config from "@api/config";

import { FileModel } from "../models/file";
import { JobHandler } from ".";

const storage = new Storage();
const bucket = storage.bucket(config.common.googleCloud.storageBucket || "");

const formatSize = (size: number, binary = true) => {
  const base = binary ? 1024 : 1000;
  const labels = binary ? ["bytes", "KiB", "MiB", "GiB", "TiB"] : ["bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(size) / Math.log(base));
  let formattedSize = `${(size / base ** i).toFixed(2)} ${labels[i]}`;
  if (size <= 0) {
    formattedSize = "0 bytes";
  }
  return formattedSize;
};

export const exportZipJobHandler: JobHandler = async (job, done) => {
  console.log("here");
  const startTime = Date.now();

  if (!job.attrs.data) {
    throw new Error("No data provided for export zip job");
  }

  const { jobId, userId, fileIds } = job.attrs.data;

  const files = await FileModel.find({ _id: { $in: fileIds } }).lean();

  const exportFile = path.join(os.tmpdir(), `${jobId}.zip`);
  const output = fs.createWriteStream(exportFile);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", async () => {
    if (job.attrs.data) {
      job.attrs.data.elapsedTime = `${((Date.now() - startTime) / 1000).toFixed(1)} seconds`;
      job.attrs.data.total = files.length;
      job.attrs.data.size = formatSize(archive.pointer());
      job.attrs.data.exportFile = exportFile;

      await job.save();
    }

    // TODO: Reenable websocket updates
    // if (userId) {
    //   webSocketServer.exportComplete(userId, jobId, "zip");
    // }

    done();
  });
  archive.on("error", (err: any) => done(err));
  archive.pipe(output);

  for (const [i, file] of files.entries()) {
    // if (userId) {
    //   const percentage = Math.round((i / files.length) * 100);
    //   webSocketServer.exportUpdate(userId, percentage);
    // }

    try {
      const blob = bucket.file(file.storageId);
      const fileStream = blob.createReadStream();
      archive.append(fileStream, {
        name: file.name,
      });
    } catch {
      console.log("Error: Participant resume not found");
    }
  }

  archive.finalize();
};
