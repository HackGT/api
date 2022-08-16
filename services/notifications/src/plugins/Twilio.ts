import { Twilio } from "twilio";
import config from "@api/config";
import { ConfigError } from "@api/common";

import { Status } from "./types";

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
  } catch (error: any) {
    console.log(error);

    return {
      error: true,
      key: recipient,
      payload: error.message,
    };
  }
};

export const sendMessages = async (message: string, numbers: string[]): Promise<Status[]> => {
  if (!serviceSid || !accountSid || !authToken) {
    throw new ConfigError("Not all Twilio env variables are provided!");
  }

  return await Promise.all(numbers.map(number => sendOneMessage(message, number)));
};
