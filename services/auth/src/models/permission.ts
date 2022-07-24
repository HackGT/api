import { UserRoles } from "@api/common";
import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
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
  },
});

permissionSchema.plugin(accessibleRecordsPlugin);

export const PermissionModel = model<Permission, AccessibleRecordModel<Permission>>(
  "Permission",
  permissionSchema
);
