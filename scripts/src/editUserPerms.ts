/**
 * NOTE
 * you must be authenticated with local gcloud
 * so that the port forwarding to mongo works.
 * Run `gcloud auth login` to do this.
 * 
 * USAGE
 * editUserPerms <email> <3digit binary string for (member)(exec)(admin) perms>
 * 
 * EXAMPLE
 * editUserPerms "some.email@hexlabs.org" "100" # grants hexlabs member perms to a user
 * editUserPerms "some.email@hexlabs.org" "110" # for exec
 * editUserPerms "some.email@hexlabs.org" "001" # admin (full access)
 */

import { MongoClient } from "mongodb";
import { ChildProcess, spawn } from "child_process";
import net from "net";
import readline from "readline/promises";

const LOCAL_PORT = 7777;
const MONGO_URI = `mongodb://127.0.0.1:${LOCAL_PORT}`;
const CONNECT_TIMEOUT_MS = 10_000;

function getRolesObject(perms: string) {
  return {
    member: perms[0] === "1",
    exec: perms[1] === "1",
    admin: perms[2] === "1",
  };
}

function waitForTunnel(tunnel: ChildProcess, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + CONNECT_TIMEOUT_MS;

    const cleanup = () => {
      clearTimeout(timer);
      tunnel.removeListener("exit", onExit);
    };

    const onExit = (code: number | null) => {
      cleanup();
      reject(new Error(`gcloud tunnel exited before connecting (code ${code}).`));
    };

    const checkPort = () => {
      if (Date.now() >= deadline) {
        cleanup();
        reject(new Error(`Timed out waiting for tunnel on port ${port}.`));
        return;
      }

      const socket = net.createConnection({
        host: "127.0.0.1",
        port,
      });

      socket.once("connect", () => {
        socket.destroy();
        cleanup();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();
        setTimeout(checkPort, 250);
      });
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for tunnel on port ${port}.`));
    }, CONNECT_TIMEOUT_MS);

    tunnel.once("exit", onExit);
    checkPort();
  });
}

async function editUserPerms(email: string, binaryPerms: string) {
  const roles = getRolesObject(binaryPerms);

  const gcloudArgs = [
    "compute",
    "ssh",
    "mongo",
    "--zone=us-east1-b",
    "--",
    "-N",
    "-L",
    `127.0.0.1:${LOCAL_PORT}:127.0.0.1:27017`
	];

  const tunnel = spawn("gcloud", gcloudArgs, {
    stdio: "inherit", // to allow password prompts if needed
  });

  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });

  try {
		console.info(`Waiting for tunnel to be ready on port ${LOCAL_PORT}...`);
    await waitForTunnel(tunnel, LOCAL_PORT);
    await client.connect();

    const profilesConn = client.db("users").collection("profiles");
    const profile = await profilesConn.findOne({ email });
    if (!profile?.userId) {
      throw new Error(`No user found with email!: ${email}. stopping.`);
    }

    console.info(`Found user profile for ${email}.`);

		// confirmatioin prompt
    const prompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      const confirmation = await prompt.question(
				`Will apply {member: ${roles.member}, exec: ${roles.exec}, admin: ${roles.admin}} to user [${profile.userId}] (y/n): `
			);
      if (confirmation.trim().toLowerCase() !== "y") {
        throw new Error("cancelled: stopping without updates.");
      }
    } finally {
      prompt.close();
    }

    const permsConn = client.db("auth").collection("permissions");
    const result = await permsConn.updateOne(
      { userId: profile.userId },
      { $set: {roles},},
      { upsert: true }
    );

    console.info("Permissions update result (upserted not null = successfully created):", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId,
    });
  } finally {
    await client.close();

    if (!tunnel.killed && tunnel.exitCode === null) {
      tunnel.kill("SIGTERM");
    }
  }
}

(async () => {
  const email = process.argv[2];
  const binaryPerms = process.argv[3];

  if (!email || !binaryPerms) {
    console.error(
      "Usage: editUserPerms <email> <3digit binary string for (member)(exec)(admin) perms>"
    );
    process.exitCode = 1;
    return;
  }

  try {
    await editUserPerms(email, binaryPerms);
    console.info("\nDone.");
  } catch (error) {
    console.error("Failed:", error);
    process.exitCode = 1;
  }
})();