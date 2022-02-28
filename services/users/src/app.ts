import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config from "@api/config";
import cookieParser from "cookie-parser";
import { decodeToken, generateMongoConnectionUri, handleError } from "@api/common";
import mongoose from "mongoose";

import { defaultRouter } from "./routes";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

mongoose.connect(generateMongoConnectionUri(config.services.USERS)).catch(err => {
  throw err;
});

app.use(helmet());
app.use(decodeToken);
app.use(morgan("dev"));
app.use(compression());
app.use(
  cors({
    // allowedHeaders: ["Content-Type", "set-cookie"],
    origin: true,
    preflightContinue: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/status", (req, res) => {
  res.status(200).end();
});

app.use("/", defaultRouter);

app.use(handleError);

app.listen(config.services.USERS.port, () => {
  console.log(`USERS service started on port ${config.services.USERS.port}`);
});
