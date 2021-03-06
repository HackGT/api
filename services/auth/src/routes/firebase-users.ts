import { asyncHandler, isAuthenticated, isMember } from "@api/common";
import express from "express";
import admin from "firebase-admin";

export const firebaseUsersRoutes = express.Router();

firebaseUsersRoutes.use(isAuthenticated);
firebaseUsersRoutes.use(isMember);

firebaseUsersRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    let pageSize = parseInt(req.query.pageSize as string) || 1000;

    if (pageSize > 1000) {
      pageSize = 1000;
    } else if (pageSize < 1) {
      pageSize = 100;
    }

    const usersResult = await admin
      .auth()
      .listUsers(pageSize, req.query.pageToken as string | undefined);

    return res.status(200).json({
      pageSize: usersResult.users.length,
      pageToken: usersResult.pageToken,
      users: usersResult.users,
    });
  })
);

firebaseUsersRoutes.route("/:userId").get(
  asyncHandler(async (req, res) => {
    const user = await admin.auth().getUser(req.params.userId);

    return res.status(200).json(user);
  })
);

firebaseUsersRoutes.route("/:userId").patch(
  asyncHandler(async (req, res) => {
    const user = await admin.auth().updateUser(req.params.userId, {
      disabled: req.body.disabled ?? undefined,
    });

    return res.status(200).json(user);
  })
);

firebaseUsersRoutes.route("/:userId").delete(
  asyncHandler(async (req, res) => {
    await admin.auth().deleteUser(req.params.userId);

    return res.status(204).end();
  })
);

firebaseUsersRoutes.route("/email/:email").get(
  asyncHandler(async (req, res) => {
    const user = await admin.auth().getUserByEmail(req.params.email);

    return res.status(200).json(user);
  })
);
