import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";

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
export const decodeToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
