import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";
import { HexathonModel } from "./hexathon";
import { HexathonUserModel } from "./hexathonUser";

export interface Team extends mongoose.Document {
  name: string;
  hexathon: Types.ObjectId;
  members: Types.ObjectId[];
  description: string;
  public: boolean;
  memberRequests: Types.DocumentArray<Request>;
  sentInvites: Types.DocumentArray<Request>;
}

export interface Request extends Types.Subdocument {
  member: Types.ObjectId;
  message: string;
}

const teamSchema = new Schema<Team>({
  name: {
    type: String,
    required: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
    index: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: HexathonUserModel,
    },
  ],
  description: {
    type: String,
    required: false,
  },
  public: {
    type: Boolean,
    required: true,
    default: false,
  },
  memberRequests: {
    type: [
      {
        member: {
          type: Schema.Types.ObjectId,
          ref: HexathonUserModel,
          required: true,
        },
        message: {
          type: String,
          required: false,
        },
      },
    ],
    default: [] as any,
  },
  sentInvites: {
    type: [
      {
        member: {
          type: Schema.Types.ObjectId,
          ref: HexathonUserModel,
          required: true,
        },
        message: {
          type: String,
          required: false,
        },
      },
    ],
    default: [] as any,
  },
});

teamSchema.plugin(accessibleRecordsPlugin);

export const TeamModel = model<Team, AccessibleRecordModel<Team>>("Team", teamSchema);
