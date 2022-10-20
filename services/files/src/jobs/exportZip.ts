import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Storage } from "@google-cloud/storage";
import config from "@api/config";
import async from "async";

import { FileModel } from "../models/file";
import { JobHandler } from ".";

const Packer = require("zip-stream"); // eslint-disable-line @typescript-eslint/no-var-requires

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
  const startTime = Date.now();

  if (!job.attrs.data) {
    throw new Error("No data provided for export zip job");
  }

  const { jobId, userId, fileIds } = job.attrs.data;

  const files = await FileModel.find({ _id: { $in: fileIds } }).lean();

  const exportFile = path.join(os.tmpdir(), `${jobId}.zip`);
  const output = fs.createWriteStream(exportFile);

  const archive = new Packer({ zlib: { level: 9 } });

  archive.on("error", (err: any) => done(err));
  archive.pipe(output);

  output.on("close", async () => {
    console.log("Exporting zip file...");
    if (job.attrs.data) {
      job.attrs.data.elapsedTime = `${((Date.now() - startTime) / 1000).toFixed(1)} seconds`;
      job.attrs.data.total = files.length;
      job.attrs.data.size = formatSize(archive.getBytesWritten());
      job.attrs.data.exportFile = exportFile;

      await job.save();
    }

    // TODO: Reenable websocket updates
    // if (userId) {
    //   webSocketServer.exportComplete(userId, jobId, "zip");
    // }

    done();
  });

  try {
    await async.eachOfSeries(files, async (file, index) => {
      // if (userId) {
      //   const percentage = Math.round((index / files.length) * 100);
      //   webSocketServer.exportUpdate(userId, percentage);
      // }

      await new Promise<void>((resolve, reject) => {
        try {
          const blob = bucket.file(file.storageId);
          const fileStream = blob.createReadStream();
          fileStream.on("error", () =>
            console.log(`Error: Participant resume not found for ${file.name}`)
          );

          archive.entry(
            fileStream,
            {
              name: `files/${file.name}`,
            },
            (err: any, entry: any) => {
              // Ignore errors that are thrown by invalid files and continue execution
              resolve();
            }
          );
        } catch (err: any) {
          console.error(err);
          reject(err);
        }
      });
    });
  } catch (err: any) {
    done(err);
  }

  await archive.finalize();
};
