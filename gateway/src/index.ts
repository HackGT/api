import { createProxyMiddleware } from "http-proxy-middleware";
import config from "@api/config";
import express from "express";
import helmet from "helmet";

const app = express();

app.use(helmet());

for (const service of Object.values(config.services)) {
  app.use(service.url, createProxyMiddleware(service.proxy));
}

app.listen(config.gateway.port, () => {
  console.log(`GATEWAY started on port ${config.gateway.port}`);
});
