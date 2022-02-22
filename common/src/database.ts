/* eslint-disable no-template-curly-in-string */
import config, { ServiceConfig } from "@api/config";

/**
 * Generates mongo connection uri and service parameters based on running environment
 */
export const generateMongoConnectionUri = (service: ServiceConfig): string => {
  if (service.database.type !== "mongo") {
    throw new Error("Cannot create mongo connection with non-mongo database.");
  }

  if (!config.database.mongo.uri.includes("${DATABASE}")) {
    throw new Error('Mongo connection uri must include "${DATABASE}" identifier');
  }

  return config.database.mongo.uri.replace("${DATABASE}", service.database.name);
};
