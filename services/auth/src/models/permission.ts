import { UserRoles } from "@api/common";
import mongoose, { Schema, model } from "mongoose";

export interface Permission extends mongoose.Document {
  userId: string;
  roles: UserRoles;
}

const permissionSchema = new Schema<Permission>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  roles: {
    member: {
      type: Boolean,
      default: false,
    },
    exec: {
      type: Boolean,
      default: false,
    },
    admin: {
      type: Boolean,
      default: false,
    },
    sponsor: {
      type: Boolean,
      default: false,
    },
  },
});

export const PermissionModel = model<Permission>("Permission", permissionSchema);
