import { Schema, model, Types, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface Profile {
  userId: string;
  name: {
    first: string;
    middle: string;
    last: string;
  };
  job: string;
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
  job: {
    type: String,
    required: false,
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
