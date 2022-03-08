import { DecodedIdToken } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved
import config from "@api/config";

/*
 * Checks if a user is a member or not depending on if their email domain matches the config
 */
export const isMember = (user: DecodedIdToken | null) => {
  const domain = user?.email?.split("@").pop();

  return domain && config.common.memberEmailDomains.includes(domain);
};
