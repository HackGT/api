import { asyncHandler, checkAbility, DEFAULT_USER_ROLES } from "@api/common";
import express from "express";

import { PermissionModel } from "../models/permission";

/**
 * Note that for all the routes in this file, the req.user.roles field is set
 * to the default values. This is to prevent an infinite loop. As such, whenever
 * you want to access user permissions, you will need to read it from the database.
 */

export const permissionRoutes = express.Router();

permissionRoutes.route("/:userId").get(
  checkAbility("read", "Permission"),
  asyncHandler(async (req, res) => {
    const permission = await PermissionModel.findOne(
      {
        userId: req.params.userId,
      },
      { _id: false }
    ).accessibleBy(req.ability);

    res.send(
      permission || {
        userId: req.params.userId,
        ...DEFAULT_USER_ROLES,
      }
    );
  })
);

permissionRoutes.route("/").post(
  checkAbility("create", "Permission"),
  asyncHandler(async (req, res) => {
    const newPermission = await PermissionModel.create(req.body);

    res.send(newPermission);
  })
);

permissionRoutes.route("/:userId").patch(
  checkAbility("update", "Permission"),
  asyncHandler(async (req, res) => {
    const newPermission = await PermissionModel.findOneAndUpdate(
      { userId: req.params.userId },
      { roles: req.body },
      { new: true }
    );

    res.send(newPermission);
  })
);
