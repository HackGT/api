import { NextFunction, Request, Response } from "express";
import admin, { FirebaseError } from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import { BadRequestError } from "./errors";

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
export const decodeToken = async (req: Request, res: Response, next: NextFunction) => {
  req.user = null;

  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;
    } catch (err) {
      console.log(err);
    }
  }

  next();
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
export const handleError = (err: any, req: Request, res: Response, next: NextFunction) => {
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
      type: "application_error",
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
