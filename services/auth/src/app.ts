import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config, { Service } from "@api/config";
import { decodeToken, handleError, rateLimiter } from "@api/common";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import { defaultRouter } from "./routes";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

if (config.common.production) {
  app.enable("trust proxy");
}

mongoose
  .connect(config.database.mongo.uri, {
    dbName: config.services.AUTH.database?.name,
  })
  .catch(err => {
    throw err;
  });
mongoose.set("runValidators", true);

app.use(helmet());
app.use(rateLimiter());
app.use(cookieParser());
app.use(decodeToken(Service.AUTH));
app.use(morgan("dev"));
app.use(compression());
app.use(
  cors({
    origin: true,
    preflightContinue: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/status", (req, res) => {
  res.status(200).end();
});

// Note: The auth service doesn't use isAuthenticated as its routes need
// to be accessed even when a user isn't authenticated
app.use("/", defaultRouter);

app.use(handleError);

app.listen(config.services.AUTH.port, () => {
  console.log(`AUTH service started on port ${config.services.AUTH.port}`);
});
