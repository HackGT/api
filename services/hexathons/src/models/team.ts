import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";
import { HexathonModel } from "./hexathon";

export interface Team extends mongoose.Document {
  name: string;
  hexathon: Types.ObjectId;
  members: string[];
  description: string;
  public: boolean;
  memberRequests: Types.DocumentArray<Request>;
  sentInvites: Types.DocumentArray<Request>;
}

export interface Request extends Types.Subdocument {
  userId: string;
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
  members: {
    type: [String],
    required: true,
    default: [],
  },
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
        userId: {
          type: String,
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
        userId: {
          type: String,
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
