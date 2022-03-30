import { Schema, model, Types } from "mongoose";

export interface Profile {
  user: string;
  name: {
    first: string;
    middle: string;
    last: string;
  };
  phoneNumber: string;
  gender: string;
  resume: Types.ObjectId;
}

const profileSchema = new Schema<Profile>({
  user: {
    type: String,
    required: true,
    unique: true,
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
});

export const ProfileModel = model<Profile>("Profile", profileSchema);
