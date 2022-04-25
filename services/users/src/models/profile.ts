import { Schema, model, Types } from "mongoose";

export interface Profile {
  user: string;
  job: string;
  name: {
    first: string;
    middle: string;
    last: string;
  };
  school: {
    name: string;
    year: string;
    major: string;
  };
  skills: string[];
  bio: string;
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
  school: {
    type: {
      name: {
        type: String,
        required: false,
      },
      year: {
        type: String,
        required: false,
      },
      major: {
        type: String,
        required: false,
      },
    },
    required: false,
  },
  skills: {
    type: [String],
    required: false,
  },
  bio: {
    type: String,
    required: false,
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
