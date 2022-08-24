import config from "@api/config";
import { SecretManagerServiceClient, protos } from "@google-cloud/secret-manager";
import fs from "fs";
import path from "path";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

const client = new SecretManagerServiceClient();

const updateSecret = async (fileName: string, service: string) => {
  const secretId = path.parse(fileName).name;

  let secret: protos.google.cloud.secretmanager.v1.ISecret;
  try {
    // Get secret
    [secret] = await client.getSecret({
      name: `projects/${config.common.googleCloud.project}/secrets/${secretId}`,
    });
  } catch {
    // Create secret if it doesn't exist
    [secret] = await client.createSecret({
      parent: `projects/${config.common.googleCloud.project}`,
      secret: {
        name: secretId,
        replication: {
          automatic: {},
        },
        labels: {
          service,
        },
      },
      secretId,
    });
    console.info(`Created secret ${secret.name}`);
  }

  // Read file
  const data = fs.readFileSync(path.resolve(__dirname, fileName), "utf8");

  // Add a new secret version
  const [version] = await client.addSecretVersion({
    parent: secret.name,
    payload: {
      data: Buffer.from(data, "utf8"),
    },
  });
  console.info(`Added secret version ${version.name}`);
};

const REGISTRATION_SECRETS = [
  "../../services/registration/src/config/calibration_question_mapping.json",
  "../../services/registration/src/config/grading_group_mapping.json",
  "../../services/registration/src/config/rubric_mapping.json",
];

(async () => {
  await Promise.all(REGISTRATION_SECRETS.map(file => updateSecret(file, "registration")));
  console.info("\nDone.");
})();
