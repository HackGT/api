import { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

import { Prisma } from "@api/prisma-finance/generated";

/**
 * Removes ANSI color/escape codes from a string to better format error messages
 * @param text the text to strip
 */
const stripAnsi = function stripAnsi(text: string) {
  const ansiRegex = new RegExp(
    [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
    ].join("|"),
    "g"
  );
  return text.replace(ansiRegex, "");
};

/**
 * Catches specific prisma errors and responds with the according HTTP status code. If an error
 * is not a prisma error, it will be passed to the default error handler.
 */
export const handlePrismaError: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  if (
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      type: "prisma_error",
      message: stripAnsi(err.message),
      stack: stripAnsi(err.stack ?? ""),
    });
    return next();
  }
  if (
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientInitializationError
  ) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      type: "prisma_error",
      message: stripAnsi(err.message),
      stack: stripAnsi(err.stack ?? ""),
    });
    return next();
  }

  return next(err);
};
