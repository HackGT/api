import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config, { Service } from "@api/config";
import { decodeToken, handleError, isAuthenticated, rateLimiter } from "@api/common";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import { defaultRouter } from "./routes";
import { addAbilities } from "./permission";

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
    dbName: config.services.HEXATHONS.database?.name,
  })
  .catch(err => {
    throw err;
  });
mongoose.set("runValidators", true);
mongoose.set("toJSON", {
  virtuals: true,
  transform: (doc, converted) => {
    delete converted._id; // eslint-disable-line no-underscore-dangle, no-param-reassign
    delete converted.__v; // eslint-disable-line no-underscore-dangle, no-param-reassign
  },
});

app.use(helmet());
app.use(rateLimiter());
app.use(cookieParser());
app.use(decodeToken(Service.HEXATHONS));
app.use(addAbilities());
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

app.use(isAuthenticated);
app.use("/", defaultRouter);

app.use(handleError);

app.listen(config.services.HEXATHONS.port, () => {
  console.log(`HEXATHONS service started on port ${config.services.HEXATHONS.port}`);
});
