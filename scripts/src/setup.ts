/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-template */
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import config from "@api/config";
import { Client } from "pg";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
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
      "Welcome to the HexLabs API setup guide! This guide will help you get ready for local development and ensure everything is working properly. \n\n Press enter to continue...\n",
  });
  await input({
    message:
      "First off, please make sure you're read through the wiki on GitHub. https://github.com/HackGT/api/wiki \n\n Press enter to continue...\n",
  });
  await confirm({ message: "I've read the wiki." });

  await confirm({
    message:
      "I've copied the .env.example file to .env in the config folder and filled in the values.",
  });
  let dotEnvFile = "";
  try {
    dotEnvFile = fs.readFileSync(path.resolve(__dirname, "../../config/.env"), "utf8");
  } catch (error) {
    logErrorAndExit(
      ".env not found. Please ensure you copy the .env.example file to .env in the /config folder."
    );
  }
  if (
    !dotEnvFile.includes("GOOGLE_CLOUD_PROJECT") ||
    !dotEnvFile.includes("MONGO_URI") ||
    !dotEnvFile.includes("POSTGRES_URI") ||
    !dotEnvFile.includes("REDIS_URI")
  ) {
    logErrorAndExit(
      ".env is missing some required variables. Please ensure you copied the correct .env.example file."
    );
  }
  if (
    !process.env.GOOGLE_CLOUD_PROJECT ||
    !process.env.MONGO_URI ||
    !process.env.POSTGRES_URI ||
    !process.env.REDIS_URI
  ) {
    logErrorAndExit(
      "process.env was not properly loaded. Please ensure you copied the correct .env.example file."
    );
  }
  if (process.env.GOOGLE_CLOUD_PROJECT !== config.common.googleCloud.project) {
    logErrorAndExit(
      "GOOGLE_CLOUD_PROJECT variable in .env does not match the project in config. Please ensure you have the correct values."
    );
  }

  await confirm({
    message:
      "I've gotten the secret google-cloud-credentials.json file from a teammate and placed it in the config folder.",
  });
  let googleCloudCredentialsFile = "";
  try {
    googleCloudCredentialsFile = fs.readFileSync(
      path.resolve(__dirname, "../../config/google-cloud-credentials.json"),
      "utf8"
    );
  } catch (error) {
    logErrorAndExit(
      "google-cloud-credentials.json not found. Please ensure you have placed in the /config folder."
    );
  }
  try {
    const parsedGoogleCloudCredentialsFile = JSON.parse(googleCloudCredentialsFile);
    if (parsedGoogleCloudCredentialsFile.project_id !== process.env.GOOGLE_CLOUD_PROJECT) {
      logErrorAndExit(
        "google-cloud-credentials.json has a mismatched project_id. Please ensure you have the correct file."
      );
    }
    if (
      parsedGoogleCloudCredentialsFile.client_email !== config.common.googleCloud.serviceAccount
    ) {
      logErrorAndExit(
        "google-cloud-credentials.json has a mismatched client_email. Please ensure you have the correct file."
      );
    }
  } catch (error) {
    logErrorAndExit(
      "google-cloud-credentials.json is not valid JSON. Please ensure you have the correct file."
    );
  }

  const pathToGoogleCloudCredentials = path.resolve(
    __dirname,
    "../../config/google-cloud-credentials.json"
  );
  await confirm({
    message: `I've filled in the GOOGLE_APPLICATION_CREDENTIALS variable in .env with the path to my google-cloud-credentials.json file (${pathToGoogleCloudCredentials}).`,
  });
  if (
    path.resolve(__dirname, "../../config/google-cloud-credentials.json") !==
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    logErrorAndExit(
      `Please ensure you have set the GOOGLE_APPLICATION_CREDENTIALS variable in .env to the path of your google-cloud-credentials.json file (${pathToGoogleCloudCredentials}).`
    );
  }

  console.log(chalk.green("\n✓ Config setup successful\n"));

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

  const prismaServices = Object.values(config.services)
    .filter(serviceConfig => serviceConfig.database.type === "postgres")
    .map(serviceConfig => serviceConfig.database.name);
  console.log();
  await input({
    message:
      "Since Postgres is a relational database, it has a strict schema definition. We use a Node ORM library called Prisma to manage our schema. For each database change, you must run a migration to update your local database. \n\n You will need to run " +
      chalk.yellow("yarn migrate:dev") +
      " in each service folder that uses Postgres These services are " +
      chalk.gray(prismaServices.join(", ")) +
      ".\n\n Press enter to continue...\n",
  });
  for (const service of prismaServices) {
    await confirm({
      message:
        "I have run " +
        chalk.yellow("yarn migrate:dev") +
        " in the " +
        chalk.gray(service) +
        " service.",
    });
    const res = await postgresClient.query(
      `select exists(SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('${service}'))`
    );
    if (!res.rows[0].exists) {
      logErrorAndExit(
        `Database ${service} for service ${service} does not exist. Please ensure you have run the migration successfully.`
      );
    }
  }

  const prismaSeedServices: string[] = [];
  for (const service of prismaServices) {
    try {
      fs.readFileSync(path.resolve(__dirname, `../../services/${service}/prisma/seed.ts`), "utf8");
      prismaSeedServices.push(service);
    } catch (error) {
      // No seed file
    }
  }
  console.log();
  await input({
    message:
      "Some Prisma services also use a seed script to populate the database with initial required data. You will need to run " +
      chalk.yellow("yarn seed") +
      " in the following service(s): " +
      chalk.gray(prismaSeedServices.join(", ")) +
      ".\n\n Press enter to continue...\n",
  });
  for (const service of prismaSeedServices) {
    await confirm({
      message:
        "I have run " + chalk.yellow("yarn seed") + " in the " + chalk.gray(service) + " service.",
    });
  }

  console.log(chalk.green("\n✓ Database setup successful\n"));

  await input({
    message:
      "Amazing! Now, let's start your backend services and ensure everything works properly. Open a new command line window and run " +
      chalk.yellow("yarn start:all") +
      " to start all the services. If you have any issues, please message your teammates. \n\n Press enter to continue...\n",
  });
  await confirm({
    message: "My backend services are all running properly without any errors.",
  });

  console.log(chalk.green("\n✓ Server setup successful\n"));

  await input({
    message:
      "The last step is to add yourself with the proper permissions in your local database. Normally in production, only another admin can update the permissions of someone else. However, since this is your local database, you'll need to add yourself as an admin directly by modifying the database. Please follow the steps in the Wiki (https://github.com/HackGT/api/wiki/3.-Authentication) to retrieve your " +
      chalk.gray("uid") +
      " from https://login.hexlabs.org. \n\n Press enter to continue...\n",
  });
  const userId = await input({
    message: chalk.cyan("What is your ") + chalk.gray("uid") + chalk.cyan("?: "),
  });
  if (userId.length < 10) {
    logErrorAndExit("Invalid uid. Please ensure you have copied the correct uid.");
  }
  const permissionsCollection = mongoClient.db("auth").collection<any>("permissions");
  try {
    const existingPermission = await permissionsCollection.countDocuments({ userId });
    if (existingPermission < 1) {
      await permissionsCollection.insertOne({
        userId,
        roles: {
          admin: true,
          exec: true,
          member: true,
        },
      });
    }
  } catch (error: any) {
    logErrorAndExit("Could not add user to permissions collection. " + error.message);
  }
  await confirm({
    message:
      "Your user has been added with the admin, exec, and member permissions. Please check your local MongoDB auth database and permissions collection to see the new document. This is important as you can update your permissions here as needed to test things work as expected for an external user.",
  });

  console.log();
  await input({
    message:
      "Additionally, will also need to setup your user profile into the users MongoDB database. This is normally done in production when you create an account, but you'll need to add it manually here. \n\n Press enter to continue...\n",
  });
  const email = await input({
    message: chalk.cyan("What is your email?"),
  });
  const firstName = await input({
    message: chalk.cyan("What is your first name?"),
  });
  const lastName = await input({
    message: chalk.cyan("What is your last name?"),
  });
  if (email.length < 2 || firstName.length < 2 || lastName.length < 2) {
    logErrorAndExit(
      "Invalid inputs. Please ensure you have entered a valid email, first name, and last name."
    );
  }
  const profilesCollection = mongoClient.db("users").collection<any>("profiles");
  try {
    const existingProfile = await profilesCollection.countDocuments({ userId });
    if (existingProfile < 1) {
      await profilesCollection.insertOne({
        userId,
        email,
        name: {
          first: firstName,
          last: lastName,
        },
      });
    }
  } catch (error: any) {
    logErrorAndExit("Could not add user info to profiles collection. " + error.message);
  }
  await confirm({
    message:
      "Your user info has been added to the MongoDB profiles collection. I can see my user info document in the database.",
  });

  console.log(chalk.green("\n✓ API setup successful\n"));
  process.exit(0);
})();
