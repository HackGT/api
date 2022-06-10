import { Schema, model, Types, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface Profile {
  userId: string;
  email: string;
  name: {
    first: string;
    middle: string;
    last: string;
  };
  phoneNumber: string;
  gender: string;
  resume: Types.ObjectId;
  permissions: {
    member: boolean;
    exec: boolean;
    admin: boolean;
  };
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
  permissions: {
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

profileSchema.plugin(mongoosePaginate);

export const ProfileModel = model<Profile, PaginateModel<Profile>>("Profile", profileSchema);
