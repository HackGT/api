import { BadRequestError } from "./errors";

/**
 * Gets a full name for a user
 * @param name Name object with different parts
 */
export const getFullName = (name?: { first: string; middle?: string; last: string }) => {
  if (!name || !name.first || !name.last) {
    throw new BadRequestError("Invalid name provided. Please update your profile and try again.");
  }

  if (name.middle) {
    return `${name.first.trim()} ${name.middle.trim()} ${name.last.trim()}`;
  }

  return `${name.first.trim()} ${name.last.trim()}`;
};
