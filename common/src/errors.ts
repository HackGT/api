/* eslint-disable max-classes-per-file */
import { AxiosResponse } from "axios";
import { FirebaseError } from "firebase-admin";
import mongoose from "mongoose";

/**
 * Error thrown when the user makes an invalid API call. This signals
 * that the request was bad.
 */
export class BadRequestError extends Error {}

/**
 * This error is thrown when the user makes a request to do or access something
 * they are not allowed to.
 */
export class ForbiddenError extends Error {}

/**
 * This error is thrown when the server's config is not setup properly. This
 * shows that the server config needs to be updated.
 */
export class ConfigError extends Error {}

/**
 * This error is thrown when a service-service api call fails. This is used to
 * help surface the proper error message to the user.
 */
export class ApiCallError extends Error {
  public status: number;
  public type: string;
  public message: string;
  public stack: string;

  constructor(response: AxiosResponse) {
    super(response.statusText);
    this.status = response.status;
    this.type = "axios_error";
    this.message = response.statusText;
    this.stack = Error().stack ?? "";

    if (response.data) {
      if (response.data.type) {
        this.type = response.data.type;
      }
      if (response.data.message) {
        this.message = response.data.message;
      }
      if (response.data.stack) {
        this.stack = response.data.stack;
      }
    }
  }
}

/**
 * Used by Sentry to determine when to handle error
 * @param err the error that was thrown
 * @returns a boolean indicating if the error should be handled
 */
export const shouldHandleError = (err: any): boolean => {
  if (
    err instanceof BadRequestError ||
    err instanceof ForbiddenError ||
    err instanceof mongoose.Error.CastError ||
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.ValidatorError ||
    (err as FirebaseError).code?.startsWith("auth/")
  ) {
    return false;
  }
  return true;
};
