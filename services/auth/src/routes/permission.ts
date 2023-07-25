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

    const permission = await PermissionModel.findOne({
      userId: req.params.userId,
    });

    res.send(
      permission || {
        userId: req.params.userId,
        roles: DEFAULT_USER_ROLES,
      }
    );
  })
);

permissionRoutes.route("/:userId").post(
  asyncHandler(async (req, res) => {
    // Need to have an admin role to update permissions
    const currentUserPermissions = await PermissionModel.findOne({
      userId: req.user?.uid,
    });
    const { member, admin, exec } = req.body.roles;
    if (!currentUserPermissions?.roles?.admin || (exec && !currentUserPermissions?.roles?.exec)) {
      throw new ForbiddenError("You do not have permission to update permissions.");
    }
    if (exec ? !(admin && member) : admin && !member) {
      throw new ForbiddenError("Invalid roles.");
    }

    let permission = await PermissionModel.findOne({ userId: req.params.userId });

    if (permission) {
      permission.roles = { ...permission.roles, ...req.body.roles };
      if (Object.values(permission.roles).every(value => value === false)) {
        await permission.remove();
        return res.status(200).send("Permission removed.");
      }
      await permission.save();
    } else {
      permission = await PermissionModel.create({
        userId: req.params.userId,
        roles: req.body.roles,
      });
    }

    return res.status(200).send(permission);
  })
);

permissionRoutes.route("/actions/retrieve").post(
  asyncHandler(async (req, res) => {
    // Need to have an admin role to use batch retrieve
    const currentUserPermissions = await PermissionModel.findOne({
      userId: req.user?.uid,
    });
    if (!currentUserPermissions?.roles?.admin) {
      throw new ForbiddenError("You do not have permission to retrieve permissions.");
    }

    const { userIds }: { userIds: string[] } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(200).json([]);
    }

    const permissions = await PermissionModel.find({
      userId: userIds,
    });

    return res.status(200).json(permissions);
  })
);

permissionRoutes.route("/actions/retrieve-members").post(
  asyncHandler(async (req, res) => {
    // Need to have an member role to use batch retrieve other members
    const currentUserPermissions = await PermissionModel.findOne({
      userId: req.user?.uid,
    });
    if (!currentUserPermissions?.roles?.member) {
      throw new ForbiddenError("You do not have permission to retrieve permissions.");
    }

    const memberPermissions = await PermissionModel.find({
      "roles.member": true,
    });

    return res.status(200).json(memberPermissions);
  })
);
