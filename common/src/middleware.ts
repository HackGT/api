/* eslint-disable no-empty */
import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import admin, { FirebaseError } from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import config from "@api/config";
import multer from "multer";
import axios from "axios";

import { BadRequestError, ForbiddenError } from "./errors";

declare global {
  namespace Express {
    interface Request {
      user: DecodedIdToken | null;
    }
  }
}

/**
 * Middleware to decode JWT from Google Cloud Identity Provider
 */
export const decodeToken: RequestHandler = async (req, res, next) => {
  req.user = null;

  let isUserDecoded = false;

  if (!isUserDecoded && req.headers?.authorization?.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];

    try {
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedIdToken;
      isUserDecoded = true;
    } catch {}
  }

  if (!isUserDecoded && req.cookies.session) {
    try {
      const decodedIdToken = await admin.auth().verifySessionCookie(req.cookies.session || "");
      req.user = decodedIdToken;
      isUserDecoded = true;
    } catch {}
  }

  next();
};

/**
 * Checks that a user is authenticated and logged in
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.user) {
    next();
    return;
  }

  next(new ForbiddenError("User is not authenticated. Please authenticate and try again."));
};

/*
 * Checks if a user is a member or not depending on if their email domain matches the config
 */
export const isMember: RequestHandler = async (req, res, next) => {
  const domain = req.user?.email?.split("@").pop();

  if (domain && config.common.memberEmailDomains.includes(domain)) {
    next();
    return;
  }

  next(new ForbiddenError("Sorry, you don't have permission to access this endpoint"));
};

/**
 * Middleware to check that API key is provided, otherwise throw a forbidden error. Only check API key in production.
 */
export const checkApiKey: RequestHandler = async (req, res, next) => {
  if (!config.common.production) {
    next();
    return;
  }

  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const apiKey = req.headers.authorization.split("Bearer ")[1];

    if (apiKey === config.common.apiKey) {
      next();
      return;
    }
  }

  next(new ForbiddenError("Request does not have valid API Key"));
};

/**
 * Middleware to handle and catch errors in async methods
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => any) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Middleware to parse errors and response with error messages
 */
export const handleError: ErrorRequestHandler = (err, req, res, next) => {
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

  console.error(err);
};
