import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import async from "async";
import { Storage } from "@google-cloud/storage";
import config from "@api/config";

import { agenda } from "../jobs";
import { FileModel } from "../models/file";

const ZipStream = require("zip-stream"); // eslint-disable-line @typescript-eslint/no-var-requires
const Agendash = require("agendash"); // eslint-disable-line @typescript-eslint/no-var-requires

const storage = new Storage();
const bucket = storage.bucket(config.common.googleCloud.storageBuckets.default);

export const jobsRoutes = express.Router();

jobsRoutes.use("/dashboard", checkAbility("manage", "Jobs"), Agendash(agenda));

jobsRoutes.route("/download").get(
  checkAbility("manage", "File"),
  asyncHandler(async (req, res) => {
    const jobId = req.query.jobId as string;

    if (!jobId) {
      res.status(404).send("Invalid job id");
    }

    const file = path.join(os.tmpdir(), `${req.query.jobId}.zip`);
    const stream = fs.createReadStream(file);

    stream.on("end", async () => {
      await fs.promises.unlink(file);
    });
    stream.on("error", err => {
      console.error(err);
      res.status(404).send("Invalid download ID");
    });
    res.attachment(`export.zip`);
    stream.pipe(res);
  })
);

jobsRoutes.route("/export-zip").post(
  checkAbility("manage", "File"),
  asyncHandler(async (req, res) => {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds)) {
      throw new BadRequestError("Invalid file ids provided.");
    }

    const jobId = crypto.randomBytes(16).toString("hex");

    await agenda.now("export-zip", {
      jobId,
      userId: req.user?.uid,
      fileIds,
    });

    res.status(200).json({ id: jobId });
  })
);

jobsRoutes.route("/resumes").post(
  checkAbility("manage", "File"),
  asyncHandler(async (req, res) => {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds)) {
      throw new BadRequestError("Invalid file ids provided.");
    }

    const files = await FileModel.find({ _id: { $in: fileIds } });

    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", "attachment; filename=resumes.zip");

    const archive = new ZipStream();

    archive.on("error", (err: Error) => {
      throw err;
    });

    archive.pipe(res);

    try {
      await async.eachOfSeries(files, async file => {
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
                name: file.name,
              },
              () => {
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
      console.error(err);
      throw err;
    }

    await archive.finalize();
  })
);
