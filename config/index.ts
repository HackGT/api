import "dotenv/config";
import admin from "firebase-admin";

import { GATEWAY, SERVICES, GENERAL } from "./dev";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: GATEWAY.firebase.projectId,
    clientEmail: GATEWAY.firebase.clientEmail,
    privateKey: GATEWAY.firebase.privateKey,
  }),
});

export const config = {
  GATEWAY: GATEWAY,
  SERVICES: SERVICES,
  GENERAL: GENERAL,
};
