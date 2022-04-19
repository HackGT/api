import { Schema, model, Types, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface Profile {
  userId: string;
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
  phoneNumber: {
    type: String,
  },
  gender: {
    type: String,
  },
  resume: Types.ObjectId,
});

profileSchema.plugin(mongoosePaginate);

export const ProfileModel = model<Profile, PaginateModel<Profile>>("Profile", profileSchema);
