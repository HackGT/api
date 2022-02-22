import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config from "@api/config";
import { decodeToken, generateMongoConnectionUri } from "@api/common";
import mongoose from "mongoose";

import { defaultRouter } from "./routes";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

mongoose.connect(generateMongoConnectionUri(config.services.INTERACTIONS)).catch(err => {
  throw err;
});

app.use(helmet());
app.use(decodeToken);
app.use(morgan("dev"));
app.use(compression());
app.use(cors());
app.use(express.json());

app.get("/status", (req, res) => {
  res.status(200).end();
});

app.use("/", defaultRouter);

app.listen(config.services.INTERACTIONS.port, () => {
  console.log(`INTERACTIONS service started on port ${config.services.INTERACTIONS.port}`);
});
