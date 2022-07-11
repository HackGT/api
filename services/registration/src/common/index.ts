import path from "path";
import fs from "fs";

export const commonDefinitions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./commonDefinitions.json"), "utf8")
);
