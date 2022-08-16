import { Twilio } from "twilio";
import config from "@api/config";

import { Status } from "./types";
import { generateErrorMessage } from "../utils";

const serviceSid = config.services.NOTIFICATIONS.pluginConfig?.twilio.serviceSID || "";
const accountSid = config.services.NOTIFICATIONS.pluginConfig?.twilio.accountSID || "AC";
const authToken = config.services.NOTIFICATIONS.pluginConfig?.twilio.authToken || "password";
const client = new Twilio(accountSid, authToken);

export const sendOneMessage = async (message: string, recipient: string): Promise<Status> => {
  try {
    const msg = await client.messages.create({
      body: message,
      messagingServiceSid: serviceSid,
      to: recipient,
    });

    return {
      error: false,
      key: recipient,
      payload: `${msg.sid}`,
    };
  } catch (error) {
    throw new Error(generateErrorMessage(error));
  }
};

export const sendMessages = async (message: string, numbers: string[]): Promise<Status[]> => {
  if (!serviceSid || !accountSid || !authToken) {
    throw new Error("Not all Twilio env variables are provided!");
  }

  return await Promise.all(numbers.map(number => sendOneMessage(message, number)));
};
