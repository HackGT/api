import concurrently from "concurrently";

concurrently([
  { command: "cd gateway && yarn dev", name: "gateway" },
  { command: "cd services/events && yarn dev", name: "events" },
  { command: "cd services/profiles && yarn dev", name: "profiles" },
  { command: "cd services/checkin && yarn dev", name: "checkin" },
  { command: "cd services/registration && yarn dev", name: "registration" },
  { command: "cd services/interactions && yarn dev", name: "interactions" },
]);
