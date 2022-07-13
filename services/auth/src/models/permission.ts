import { UserRoles } from "@api/common";
import { Schema, model } from "mongoose";

export interface Permission {
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
  },
});

export const PermissionModel = model<Permission>("Permission", permissionSchema);
