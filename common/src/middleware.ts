/* eslint-disable no-empty */
import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import admin, { FirebaseError } from "firebase-admin";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import config, { Service } from "@api/config";
import multer from "multer";
import axios from "axios";
import { Subject } from "@casl/ability";
import { OAuth2Client } from "google-auth-library";

import { ApiCallError, BadRequestError, ConfigError, ForbiddenError } from "./errors";
import { AbilityAction, DEFAULT_USER_ROLES, User, UserRoles } from "./types";
import { apiCall } from "./apiCall";

/**
 * Middleware to handle and catch errors in async methods
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => any) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const oAuth2Client = config.common.googleCloud.oAuthClientId
  ? new OAuth2Client(config.common.googleCloud.oAuthClientId)
  : undefined;

/**
 * Middleware to decode JWT from Google Cloud Identity Provider
 */
export const decodeToken = (service: Service) =>
  asyncHandler(async (req, res, next) => {
    let decodedIdToken: Omit<User, "roles"> | null = null;
    let isUserDecoded = false;

    if (oAuth2Client && !isUserDecoded && req.headers?.authorization?.startsWith("Bearer ")) {
      const idToken = req.headers.authorization.split("Bearer ")[1];
      console.log(idToken);

      try {
        const ticket = await oAuth2Client.verifyIdToken({
          idToken,
        });

        const tokenPayload = ticket.getPayload();
        const userId = ticket.getUserId();

        console.log(tokenPayload);
        console.log(userId);

        if (tokenPayload && userId) {
          decodedIdToken = {
            uid: userId,
            ...tokenPayload,
          };
          isUserDecoded = true;
        } else {
          throw new Error("Invalid ticket payload");
        }
      } catch (err) {
        req.userError = err;
      }
    }
    if (!isUserDecoded && req.headers?.authorization?.startsWith("Bearer ")) {
      const idToken = req.headers.authorization.split("Bearer ")[1];

      try {
        decodedIdToken = await admin.auth().verifyIdToken(idToken);
        isUserDecoded = true;
      } catch (err) {
        req.userError = err;
      }
    }
    if (!isUserDecoded && req.cookies.session) {
      try {
        decodedIdToken = await admin.auth().verifySessionCookie(req.cookies.session || "");
        isUserDecoded = true;
      } catch (err) {
        req.userError = err;
      }
    }

    // If decodedIdToken is null, it means the user is not authenticated
    if (decodedIdToken === null) {
      req.user = null;
      next();
      return;
    }

    // Manage and retrieve user role permissions
    try {
      let roles: UserRoles;
      // Add special checkcase for permissions to prevent infinite loop
      if (service === Service.AUTH && req.path.includes("/permissions")) {
        roles = DEFAULT_USER_ROLES;
      } else {
        roles = (
          await apiCall(
            Service.AUTH,
            { method: "GET", url: `/permissions/${decodedIdToken.uid}` },
            req
          )
        ).roles;
      }

      req.user = {
        ...decodedIdToken,
        roles,
      };
    } catch (err) {
      req.user = null;
      req.userError = err;
    }

    next();
  });

/**
 * Checks that a user is authenticated and logged in
 */
export const isAuthenticated: RequestHandler = asyncHandler(async (req, res, next) => {
  if (req.user) {
    next();
    return;
  }

  // Allow pre-flight requests per https://stackoverflow.com/questions/15734031/why-does-the-preflight-options-request-of-an-authenticated-cors-request-work-in
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  // Throw an error from firebase if the user authentication fails
  if (req.userError) {
    throw req.userError;
  }

  next(new ForbiddenError("User is not authenticated. Please authenticate and try again."));
});

/*
 * Checks if a user is a member or not depending on if their email domain matches the config
 */
export const isMember: RequestHandler = asyncHandler(async (req, res, next) => {
  const domain = req.user?.email?.split("@").pop();

  if (domain && config.common.memberEmailDomains.includes(domain)) {
    next();
    return;
  }

  next(
    new ForbiddenError(
      "Sorry, you don't have permission to access this endpoint as you are not a HexLabs member."
    )
  );
});

/**
 * Middleware to check that the user has the correct permissions to access the
 * endpoint. Uses @casl library for permission checking. Throws ForbiddenError
 * if invalid permissions as defined per service.
 */
export const checkAbility =
  (action: AbilityAction, subject: Subject, field?: string | undefined): RequestHandler =>
  (req, res, next) => {
    if (req.ability.can(action, subject, field)) {
      next();
    } else {
      throw new ForbiddenError("You are not authorized to perform this action.");
    }
  };

/**
 * Middleware to parse errors and response with error messages
 */
export const handleError: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  if (
    err instanceof mongoose.Error.CastError ||
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.ValidatorError
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      type: "mongo_error",
      message: err.message,
      stack: err.stack,
    });
  } else if (
    err instanceof mongoose.Error.DivergentArrayError ||
    err instanceof mongoose.Error.MissingSchemaError ||
    err instanceof mongoose.Error.DocumentNotFoundError ||
    err instanceof mongoose.Error.MongooseServerSelectionError ||
    err instanceof mongoose.Error.OverwriteModelError ||
    err instanceof mongoose.Error.ParallelSaveError ||
    err instanceof mongoose.Error.StrictModeError ||
    err instanceof mongoose.Error.VersionError
  ) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      type: "mongo_error",
      message: err.message,
      stack: err.stack,
    });
  } else if (err.name === "MongoServerError" && err.code === 11000) {
    // Add special handler for duplicate key error on unique fields
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      type: "mongo_error",
      message: err.message,
      stack: err.stack,
    });
  } else if (err instanceof multer.MulterError) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      type: "upload_error",
      message: err.message,
      stack: err.stack,
    });
  } else if ((err as FirebaseError).code?.startsWith("auth/")) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      type: "firebase_auth",
      message: err.message,
      stack: err.stack,
    });
  } else if (err instanceof BadRequestError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      type: "user_error",
      message: err.message,
      stack: err.stack,
    });
  } else if (err instanceof ForbiddenError) {
    res.status(StatusCodes.FORBIDDEN).json({
      status: StatusCodes.FORBIDDEN,
      type: "user_error",
      message: err.message,
      stack: err.stack,
    });
  } else if (err instanceof ConfigError) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      type: "server_error",
      message: err.message,
      stack: err.stack,
    });
  } else if (err instanceof ApiCallError) {
    res.status(err.status).json({
      status: err.status,
      type: err.type,
      message: err.message,
      stack: err.stack,
    });
  } else if (axios.isAxiosError(err)) {
    res.status(err.response?.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: err.response?.status || StatusCodes.INTERNAL_SERVER_ERROR,
      type: "axios_error",
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      type: "application_error",
      message: err.message,
      stack: err.stack,
    });
  }
};
