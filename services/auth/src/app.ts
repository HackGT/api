import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";

import { config } from "@api/config";

export const app = express();

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

app.use(morgan("dev"));
// app.use(compression());
// app.use(express.json());

app.get("/status", (req, res) => {
  res.status(200).end();
});

export const startAuthServer = () => {
  app.listen(config.SERVICES.AUTH.port, () => {
    console.log(`AUTH service started on port ${config.SERVICES.AUTH.port}`);
  });
};
