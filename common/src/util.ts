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

/**
 * returns all items from an array that are the "smallest", as defined by `key`,
 * or if key isnt provided, just by the items themselves.
 *
 * Use this instead of sorting and taking [0] and filtering by that
 *
 * @param arr array to search through
 * @param key function to get the key that's used to define "smallest"
 * @returns an array of all items that are the smallest according to `key`
 */
export function getAllSmallest<T>(arr: T[], key?: (item: T) => number): T[] {
  if (arr.length === 0) return [];

  const getValue = key || ((item: T) => item);

  let minValue = getValue(arr[0]);

  for (const item of arr) {
    const value = getValue(item);
    if (value < minValue) {
      minValue = value;
    }
  }

  return arr.filter(item => getValue(item) === minValue);
}
