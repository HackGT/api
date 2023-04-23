/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime";
import { NextFunction, Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

/**
 * Error handling middleware for route endpoints. Will catch Prisma errors and respond with the
 * according HTTP status code.
 */
export function handleError(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof PrismaClientKnownRequestError) {
    console.error(`[PRISMA ERROR]: Code = ${err.code}`);
    res.status(StatusCodes.BAD_REQUEST).json({
      message: "Sorry, something went wrong. Please try agian.",
      detail: err.message,
    });
  } else if (
    err instanceof PrismaClientUnknownRequestError ||
    err instanceof PrismaClientValidationError
  ) {
    console.error("[PRISMA ERROR]");
    res.status(StatusCodes.BAD_REQUEST).json({
      message: "Sorry, something went wrong. Please try agian.",
      detail: err.message,
    });
  } else if (
    err instanceof PrismaClientRustPanicError ||
    err instanceof PrismaClientInitializationError
  ) {
    console.error("[PRISMA ERROR]");
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Sorry, the server encountered an unknown error. Please try again.",
      detail: err.message,
    });
  } else {
    console.error("[EXPRESS ERROR]");
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Sorry, something went wrong with this request. Please try again.",
      detail: err.message,
    });
  }
  console.error(err);
}
