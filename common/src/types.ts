import { Ability, AbilityTuple, Subject, MongoQuery } from "@casl/ability";
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

/**
 * Model representing a user. Based on Firebase library DecodedIdToken and google-auth-library TokenPayload.
 */
export interface User {
  /**
   * The user's unique ID.
   */
  uid: string;
  /**
   * The email of the user to whom the ID token belongs, if available.
   */
  email?: string;
  /**
   * Whether or not the email of the user to whom the ID token belongs is
   * verified, provided the user has an email.
   */
  email_verified?: boolean;
  /**
   * The permission roles for this user.
   */
  roles: UserRoles;
  /**
   * The audience for which this token is intended.
   */
  aud: string;
  /**
   * The issuer identifier for the issuer of the response.
   */
  iss: string;
  /**
   * The time the ID token was issued, represented in Unix time (integer
   * seconds).
   */
  iat: number;
  /**
   * The time the ID token expires, represented in Unix time (integer seconds).
   */
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      /**
       * Represents the user that is currently authenticated.
       */
      user: User | null;

      /**
       * Used to set an error when decoding the user token. This is used so that when isAuthenticated
       * is called, the middleware can check if the user is authenticated or not, and if not, throw
       * an appropriate error.
       */
      userError: any;

      ability: Ability<AbilityTuple<AbilityAction, Subject>, MongoQuery<any>>;
    }
  }
}

/**
 * Follows the definition from mongoose.PopulatedDoc. Essentially a wrapper around a mongose
 * type to include the _id field when populated.
 */
export type AutoPopulatedDoc<PopulatedType> = PopulatedType & { _id: mongoose.RefType };

/**
 * All the types of actions that can be performed on the system. Used for @casl/ability
 * for managing permissions.
 */
export type AbilityAction = "read" | "create" | "update" | "delete" | "manage" | "aggregate";
