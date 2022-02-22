/* eslint-disable no-template-curly-in-string */
import mongoose from "mongoose";
import config, { ServiceConfig } from "@api/config";

/**
 * Generates mongo connection uri and service parameters based on running environment
 */
export const generateMongoConnection = (
  service: ServiceConfig
): { uri: string; options?: mongoose.ConnectOptions | undefined } => {
  if (service.database.type !== "mongo") {
    throw new Error("Cannot create mongo connection with non-mongo database.");
  }

  if (!config.database.mongo.uri.includes("${DATABASE}")) {
    throw new Error('Mongo connection uri must include "${DATABASE}" identifier');
  }

  const uri = config.database.mongo.uri.replace("${DATABASE}", service.database.name);

  // if (config.common.production) {
  //   if (!config.database.mongo.tlsCAFile) {
  //     throw new Error("Mongo tlsCAFile required to connect to production database.");
  //   }

  //   return {
  //     uri,
  //     options: {
  //       tls: true,
  //       tlsCAFile: config.database.mongo.tlsCAFile,
  //     },
  //   };
  // }

  return { uri };
};
