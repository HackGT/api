/* eslint-disable @typescript-eslint/no-shadow */
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
      "Then, make sure you've run the setup script (run via yarn setup) to ensure that your local environment is setup correctly for seeding. \n\n Press enter to continue...\n",
  });

  const answer = await confirm({ message: "I've read the wiki and run yarn setup." });
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

  // Seed users
  const usersDB = mongoClient.db("users");

  // Seed profiles
  const profilesCollection = usersDB.collection("profiles");
  const profilesData = JSON.parse(fs.readFileSync(path.join(__dirname, "profiles.json"), "utf-8"));

  // await profilesCollection.deleteMany({});
  await profilesCollection.insertMany(profilesData);

  const companies = usersDB.collection("companies");
  const companiesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "companies.json"), "utf-8")
  );

  // await companies.deleteMany({});
  await companies.insertMany(companiesData);

  // Seed auth
  const authDB = mongoClient.db("auth");
  const permissionsCollection = authDB.collection("permissions");
  const authData = JSON.parse(fs.readFileSync(path.join(__dirname, "permissions.json"), "utf-8"));

  // await permissionsCollection.deleteMany({});
  await permissionsCollection.insertMany(authData);

  // Seed hexathons
  const hexathonsDB = mongoClient.db("hexathons");
  const hexathonsCollection = hexathonsDB.collection("hexathons");
  const hexathonsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "hexathons.json"), "utf-8")
  );

  // await hexathonsCollection.deleteMany({});
  await hexathonsCollection.insertMany(hexathonsData);

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
  await postgresClient.end();
  console.log(chalk.green("✓ Postgres connection successful"));

  await input({
    message:
      "Great! The Postgres database is running. The next step is to seed the databases. \n\n Press enter to continue...\n",
  });

  const expoClient = new Client({
    connectionString: config.database.postgres.uri + "/expo",
  });

  await expoClient.connect();

  // Seed expo config
  const rawConfig = fs.readFileSync(path.join(__dirname, "expo-config.csv"), "utf-8");
  const expoConfig = rawConfig.split("\n").map((row: string) => row.split(","));

  const [
    currentRound,
    currentExpo,
    isJudgingOn,
    isProjectsPublished,
    isProjectSubmissionOpen,
    isDevpostCheckingOn,
    revealTableGroups,
    numberOfExpo,
    currentHexathon,
    revealWinners,
  ] = expoConfig[0];
  const query = `INSERT INTO "config" ("currentRound", "currentExpo", "isJudgingOn", "isProjectsPublished", "isProjectSubmissionOpen", "isDevpostCheckingOn", "revealTableGroups", "numberOfExpo", "currentHexathon", "revealWinners") VALUES (${parseInt(
    currentRound
  )}, ${parseInt(currentExpo)}, ${isJudgingOn === "true"}, ${isProjectsPublished === "true"}, ${
    isProjectSubmissionOpen === "true"
  }, ${isDevpostCheckingOn === "true"}, ${revealTableGroups === "true"}, ${parseInt(
    numberOfExpo
  )}, '${currentHexathon}', ${revealWinners === "true"});`;
  await expoClient.query(query);

  // Seed Expo users
  const rawUsers = fs.readFileSync(path.join(__dirname, "expo-users.csv"), "utf-8");
  const expoUsers = rawUsers.split("\n").map((row: string) => row.split(","));

  expoUsers.forEach(async (user: string[]) => {
    const [name, email, userId] = user;
    const query = `INSERT INTO "user" ("name", "email", "userId") VALUES ('${name}', '${email}', '${userId}');`;
    await expoClient.query(query);
  });

  // Seed Expo table groups
  const rawTableGroups = fs.readFileSync(path.join(__dirname, "expo-tablegroups.csv"), "utf-8");
  const expoTableGroups = rawTableGroups.split("\n").map((row: string) => row.split(","));

  expoTableGroups.forEach(async (tableGroup: string[]) => {
    const [name, shortCode, color, tableCapacity, hexathon] = tableGroup;
    const query = `INSERT INTO table_group ("name", "shortCode", "color", "tableCapacity", "hexathon") VALUES ('${name}', '${shortCode}', '${color}', '${tableCapacity}', '${hexathon}');`;
    await expoClient.query(query);
  });

  // Seed Expo projects
  const rawProjects = fs.readFileSync(path.join(__dirname, "expo-projects.csv"), "utf-8");
  const expoProjects = rawProjects.split("\n").map((row: string) => row.split(","));

  let counter = 1;
  for (const project of expoProjects) {
    const [name, description, devpostUrl, githubUrl, expo, round, table, tableGroupId, hexathon] =
      project;
    const query = `INSERT INTO "project" ("id", "name", "description", "devpostUrl", "githubUrl", "expo", "round", "table", "tableGroupId", "hexathon") VALUES (${counter}, '${name}', '${description}', '${devpostUrl}', '${githubUrl}', ${parseInt(
      expo
    )}, ${parseInt(round)}, ${parseInt(table)}, ${parseInt(tableGroupId)}, '${hexathon}');`;
    await expoClient.query(query);

    counter += 1;
  }

  await expoClient.end();
  console.log(chalk.green("✓ Database seeding successful"));
  process.exit(0);
})();
