/* eslint-disable import/no-extraneous-dependencies */
import concurrently from "concurrently";

concurrently([
  { command: "cd gateway && yarn dev", name: "gateway" },
  { command: "cd services/hexathons && yarn dev", name: "hexathons" },
  { command: "cd services/auth && yarn dev", name: "auth" },
  { command: "cd services/users && yarn dev", name: "users" },
  { command: "cd services/checkin && yarn dev", name: "checkin" },
  { command: "cd services/registration && yarn dev", name: "registration" },
  { command: "cd services/interactions && yarn dev", name: "interactions" },
  { command: "cd services/notifications && yarn dev", name: "notifications" },
  { command: "cd services/files && yarn dev", name: "files" },
]);
