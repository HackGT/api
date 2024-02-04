/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-template */
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import config from "@api/config";
import { Client } from "pg";

process.on("unhandledRejection", err => {
  throw err;
});

const logErrorAndExit = (errorMessage: string) => {
  console.log(chalk.red("Error: ") + errorMessage);
  process.exit(0);
};

(async () => {
  let answer;
  await input({
    message:
      "Welcome to the HexLabs API database seed guide! This guide will help seed your local database so that you have some data to test new features locally. \n\n Press enter to continue...\n",
  });

  await input({
    message:
      "First off, please make sure you're read through the wiki on GitHub. https://github.com/HackGT/api/wiki \n\n Press enter to continue...\n",
  });

  await input({
    message:
      "Then, make sure you've run the setup script (run via yarn seed) to ensure that your local environment is setup correctly for seeding. \n\n Press enter to continue...\n",
  });

  answer = await confirm({ message: "I've read the wiki and run yarn setup." });
  if (!answer) logErrorAndExit("Please read the wiki and run yarn setup before continuing.");

  await input({
    message:
      "Great! The next step is checking your database setup. Please ensure you have a local MongoDB server and Postgres server running locally. We use both of these database systems for different services since they have different strengths. \n\n Press enter to continue...\n",
  });

  console.log("Checking MongoDB database setup...");
  const mongoClient = new MongoClient("mongodb://localhost");
  try {
    await mongoClient.connect();
  } catch (error: any) {
    console.log(
      "Could not connect to MongoDB. Please ensure your connection string in .env has the correct user and password. " +
        error.message
    );
  }
  console.log(chalk.green("✓ MongoDB connection successful"));

  await input({
    message:
      "Great! The MongoDB database is running. The next step is to seed the databases. \n\n Press enter to continue...\n",
  });
  const usersDB = mongoClient.db("users");

  // Seed profiles
  const profilesCollection = usersDB.collection("profiles");
  const profilesData = JSON.parse(fs.readFileSync(path.join(__dirname, "profiles.json"), "utf-8"));

  // await profilesCollection.deleteMany({});
  await profilesCollection.insertMany(profilesData);

  // Seed auth
  const authDB = mongoClient.db("auth");
  const permissionsCollection = authDB.collection("permissions");
  const authData = JSON.parse(fs.readFileSync(path.join(__dirname, "permissions.json"), "utf-8"));

  // await permissionsCollection.deleteMany({});
  await permissionsCollection.insertMany(authData);

  console.log("Checking Postgres database setup...");
  const postgresClient = new Client({
    connectionString: config.database.postgres.uri,
  });
  try {
    await postgresClient.connect();
  } catch (error: any) {
    logErrorAndExit(
      "Could not connect to Postgres. Please ensure your connection string in .env has the correct user and password. " +
        error.message
    );
  }
  console.log(chalk.green("✓ Postgres connection successful"));
})();
