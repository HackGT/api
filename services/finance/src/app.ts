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
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

import { defaultRouter } from "./routes";
import { addAbilities } from "./permission";
import { handlePrismaError } from "./util/handlePrismaError";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

if (config.common.production) {
  app.enable("trust proxy");

  Sentry.init({
    dsn: config.services.FINANCE.sentryDSN,
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

app.use(helmet());
app.use(rateLimiter());
app.use(cookieParser());
app.use(decodeToken(Service.FINANCE));
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
app.use(handlePrismaError);
app.use(handleError);

app.listen(config.services.FINANCE.port, () => {
  console.log(`FINANCE service started on port ${config.services.FINANCE.port}`);
});
