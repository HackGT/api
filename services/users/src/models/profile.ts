import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

export interface Profile extends mongoose.Document {
  userId: string;
  email: string;
  name: {
    first: string;
    middle?: string;
    last: string;
  };
  phoneNumber?: string;
  gender?: string;
  resume?: Types.ObjectId;
  company?: string;
}

const profileSchema = new Schema<Profile>({
  userId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  name: {
    first: {
      type: String,
      required: true,
    },
    middle: {
      type: String,
    },
    last: {
      type: String,
      required: true,
    },
  },
  phoneNumber: {
    type: String,
  },
  gender: {
    type: String,
  },
  resume: Types.ObjectId,
  company: {
    type: String
  }
});

profileSchema.plugin(accessibleRecordsPlugin);

export const ProfileModel = model<Profile, AccessibleRecordModel<Profile>>(
  "Profile",
  profileSchema
);
