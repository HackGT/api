import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import config, { Service } from "@api/config";
import {
  decodeToken,
  handleError,
  isAuthenticated,
  rateLimiter,
  shouldHandleError,
} from "@api/common";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

import { defaultRouter } from "./routes";
import { addAbilities } from "./permission";
import { startJobProcessing } from "./jobs";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

if (config.common.production) {
  app.enable("trust proxy");

  Sentry.init({
    dsn: config.services.FILES.sentryDSN,
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
    dbName: config.services.FILES.database.name,
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
app.use(decodeToken(Service.FILES));
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

if (config.common.production) {
  app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError,
    })
  );
}
app.use(handleError);

startJobProcessing().catch(err => {
  throw err;
});

app.listen(config.services.FILES.port, () => {
  console.log(`FILES service started on port ${config.services.FILES.port}`);
});
