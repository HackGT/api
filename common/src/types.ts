import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import mongoose from "mongoose";

/**
 * User roles in the system for managing permissions.
 */
export interface UserRoles {
  member: boolean;
  exec: boolean;
  admin: boolean;
}

/**
 * Default permission roles for new users.
 */
export const DEFAULT_USER_ROLES: UserRoles = {
  member: false,
  exec: false,
  admin: false,
};

declare global {
  namespace Express {
    interface Request {
      /**
       * Represents the user that is currently authenticated.
       */
      user: (DecodedIdToken & { roles: UserRoles }) | null;

      /**
       * Used to set an error when decoding the user token. This is used so that when isAuthenticated
       * is called, the middleware can check if the user is authenticated or not, and if not, throw
       * an appropriate error.
       */
      userError: any;
    }
  }
}

/**
 * Follows the definition from mongoose.PopulatedDoc. Essentially a wrapper around a mongose
 * type to include the _id field when populated.
 */
export type AutoPopulatedDoc<PopulatedType> = PopulatedType & { _id: mongoose.RefType };
