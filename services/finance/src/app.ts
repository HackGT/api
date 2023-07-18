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
import { ApolloServer, gql, makeExecutableSchema } from "apollo-server-express";
import { applyMiddleware } from "graphql-middleware";
import { graphqlUploadExpress } from "graphql-upload";
import fs from "fs";
import path from "path";

import { defaultRouter } from "./routes";
import { addAbilities } from "./permission";
import { resolvers, permissions } from "./api/api";
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

const typeDefs = gql`
  ${fs.readFileSync(path.resolve(__dirname, "./api.graphql"), "utf8")}
`;

const schema = applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), permissions);

const server = new ApolloServer({
  schema,
  context: ({ req }: { req: express.Request }) => ({ user: req.user }),
  playground: process.env.PRODUCTION !== "true" && {
    settings: {
      "editor.theme": "dark",
      "request.credentials": "include",
    },
  },
  introspection: process.env.PRODUCTION !== "true",
  formatError: err => {
    console.error(err);
    return err;
  },
  uploads: false, // https://github.com/apollographql/apollo-server/issues/3508#issuecomment-662371289
});

app.use(graphqlUploadExpress({ maxFileSize: 1024 * 1024 * 6, maxFiles: 15 }));
server.applyMiddleware({ app });

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
