import { asyncHandler, DEFAULT_USER_ROLES, ForbiddenError } from "@api/common";
import express from "express";

import { PermissionModel } from "../models/permission";

/**
 * Note that for all the routes in this file, the req.user.roles field is set
 * to the default values. This is to prevent an infinite loop. As such, whenever
 * you want to access user permissions, you will need to read it from the database.
 */

export const permissionRoutes = express.Router();

permissionRoutes.route("/:userId").get(
  asyncHandler(async (req, res) => {
    // If the user is not checking their own permissions, they must have the member role
    if (req.params.userId !== req.user?.uid) {
      const currentUserPermissions = await PermissionModel.findOne({
        userId: req.user?.uid,
      });
      if (!currentUserPermissions?.roles?.member) {
        res.send({});
        return;
      }
    }

    const permission = await PermissionModel.findOne(
      {
        userId: req.params.userId,
      },
      { _id: false }
    );

    res.send(
      permission || {
        userId: req.params.userId,
        ...DEFAULT_USER_ROLES,
      }
    );
  })
);

permissionRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const currentUserPermissions = await PermissionModel.findOne({
      userId: req.user?.uid,
    });
    if (!currentUserPermissions?.roles?.admin) {
      throw new ForbiddenError("You do not have permission to access this endpoint.");
    }

    const newPermission = await PermissionModel.create(req.body);

    res.send(newPermission);
  })
);

permissionRoutes.route("/:userId").patch(
  asyncHandler(async (req, res) => {
    const currentUserPermissions = await PermissionModel.findOne({
      userId: req.user?.uid,
    });
    if (!currentUserPermissions?.roles?.admin) {
      throw new ForbiddenError("You do not have permission to access this endpoint.");
    }

    const roles = req.body?.roles;
    const newPermission = await PermissionModel.findOneAndUpdate(
      { userId: req.params.userId },
      { roles },
      { new: true }
    );

    res.send(newPermission);
  })
);
