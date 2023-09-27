import config from "@api/config";
import Agenda, { Job, JobAttributesData } from "agenda";

import { exportZipJobHandler } from "./exportZip";

export const agenda = new Agenda({
  db: { address: `${config.database.mongo.uri}/${config.services.FILES.database.name}` },
});

export type JobHandler = (job: Job<JobAttributesData>, done: (err?: Error) => void) => void;

agenda.define("export-zip", { concurrency: 3, priority: 10 }, exportZipJobHandler);

export async function startJobProcessing() {
  await agenda.start();
}
