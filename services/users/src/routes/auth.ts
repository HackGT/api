import { asyncHandler, BadRequestError } from "@api/common";
import config from "@api/config";
import express from "express";
import admin from "firebase-admin";

export const authRoutes = express.Router();

// Create the session cookie. This will also verify the ID token in the process.
// The session cookie will have the same claims as the ID token.
// To only allow session cookie setting on recent sign-in, auth_time in ID token
// can be checked to ensure user was recently signed in before creating a session cookie.

authRoutes.route("/login").post(
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const decodedIdToken = await admin.auth().verifyIdToken(idToken);

    // Only process if the user just signed in in the last 5 minutes.
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

      // Set cookie policy for session cookie.
      res.cookie("session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: config.common.production,
        domain: config.common.production ? ".hexlabs.org" : "",
        sameSite: "none",
      });
      res.sendStatus(204);
    } else {
      // A user that was not recently signed in is trying to set a session cookie.
      // To guard against ID token theft, require re-authentication.
      throw new BadRequestError("Recent sign in is required");
    }
  })
);

authRoutes.route("/status").get(
  asyncHandler(async (req, res) => {
    const decodedIdToken = await admin.auth().verifySessionCookie(req.cookies.session || "");
    const customToken = await admin.auth().createCustomToken(decodedIdToken.uid);

    return res.json({
      customToken,
    });
  })
);

authRoutes.route("/logout").all(
  asyncHandler(async (req, res) => {
    res.clearCookie("session", {
      domain: config.common.production ? ".hexlabs.org" : "",
      httpOnly: true,
      maxAge: 0,
    });
    res.sendStatus(204);
  })
);
