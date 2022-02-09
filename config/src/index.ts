import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import * as devConfig from "./dev";
import * as prodConfig from "./prod";
import { Config } from "./types";

let config: Config;

if (process.env.PRODUCTION == "true") {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: prodConfig.GATEWAY.firebase.projectId,
      clientEmail: prodConfig.GATEWAY.firebase.clientEmail,
      privateKey: prodConfig.GATEWAY.firebase.privateKey,
    }),
  });

  config = {
    gateway: prodConfig.GATEWAY,
    database: prodConfig.DATABASE,
    services: prodConfig.SERVICES,
    general: prodConfig.GENERAL,
  };
} else {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: devConfig.GATEWAY.firebase.projectId,
      clientEmail: devConfig.GATEWAY.firebase.clientEmail,
      privateKey: devConfig.GATEWAY.firebase.privateKey,
    }),
  });

  config = {
    gateway: devConfig.GATEWAY,
    database: devConfig.DATABASE,
    services: devConfig.SERVICES,
    general: devConfig.GENERAL,
  };
}

export default config;
