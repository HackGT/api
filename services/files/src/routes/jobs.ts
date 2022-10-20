import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import path from "path";

import { agenda } from "../jobs";

const Agendash = require("agendash"); // eslint-disable-line @typescript-eslint/no-var-requires

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
