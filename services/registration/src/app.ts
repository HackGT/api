import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config from "@api/config";
import { decodeToken, generateMongoConnection } from "@api/common";
import mongoose from "mongoose";

import { defaultRouter } from "./routes";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const { uri, options } = generateMongoConnection(config.services.REGISTRATION);
mongoose.connect(uri, options).catch(err => {
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

app.listen(config.services.REGISTRATION.port, () => {
  console.log(`REGISTRATION service started on port ${config.services.REGISTRATION.port}`);
});
