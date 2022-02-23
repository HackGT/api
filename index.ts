/* eslint-disable import/no-extraneous-dependencies */
import concurrently from "concurrently";

concurrently([
  { command: "cd gateway && yarn dev", name: "gateway" },
  { command: "cd services/events && yarn dev", name: "events" },
  { command: "cd services/users && yarn dev", name: "users" },
  { command: "cd services/checkin && yarn dev", name: "checkin" },
  { command: "cd services/registration && yarn dev", name: "registration" },
  { command: "cd services/interactions && yarn dev", name: "interactions" },
  { command: "cd services/notifications && yarn dev", name: "notifications" },
]);
