import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config from "@api/config";
import { decodeToken, handleError } from "@api/common";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import { defaultRouter } from "./routes";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

mongoose
  .connect(config.database.mongo.uri, {
    dbName: config.services.FILES.database.name,
  })
  .catch(err => {
    throw err;
  });

app.use(helmet());
app.use(cookieParser());
app.use(decodeToken);
app.use(morgan("dev"));
app.use(compression());
app.use(cors());
app.use(express.json());

app.get("/status", (req, res) => {
  res.status(200).end();
});

app.use("/", defaultRouter);

app.use(handleError);

app.listen(config.services.FILES.port, () => {
  console.log(`FILES service started on port ${config.services.FILES.port}`);
});
