import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config, { Service } from "@api/config";
import { decodeToken, handleError, rateLimiter, shouldHandleError } from "@api/common";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

import { defaultRouter } from "./routes";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

if (config.common.production) {
  app.enable("trust proxy");

  Sentry.init({
    dsn: config.services.AUTH.sentryDSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
  });
  app.use(
    Sentry.Handlers.requestHandler({
      user: ["uid", "email"],
    })
  );
  app.use(Sentry.Handlers.tracingHandler());
}

mongoose.set("strictQuery", true);
mongoose
  .connect(config.database.mongo.uri, {
    dbName: config.services.AUTH.database.name,
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

if (config.common.production) {
  app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError,
    })
  );
}
app.use(handleError);

app.listen(config.services.AUTH.port, () => {
  console.log(`AUTH service started on port ${config.services.AUTH.port}`);
});
