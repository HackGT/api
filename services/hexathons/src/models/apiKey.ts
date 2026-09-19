import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";
import { HexathonUserModel } from "./hexathonUser";

export interface ApiKey extends mongoose.Document {
  hexathon: Types.ObjectId;
  provider: string;
  key: string;
  hexathonUser?: Types.ObjectId;
  claimedAt?: Date;
}

const apiKeySchema = new Schema<ApiKey>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
  },
  provider: {
    type: String,
    required: true,
    default: "openai",
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  hexathonUser: {
    type: Schema.Types.ObjectId,
    ref: HexathonUserModel,
  },
  claimedAt: {
    type: Date,
  },
});

apiKeySchema.index({ hexathon: 1, provider: 1 });

apiKeySchema.index(
  { hexathon: 1, provider: 1, hexathonUser: 1 },
  { unique: true, partialFilterExpression: { hexathonUser: { $type: "objectId" } } }
);

apiKeySchema.plugin(accessibleRecordsPlugin);

export const ApiKeyModel = model<ApiKey, AccessibleRecordModel<ApiKey>>("ApiKey", apiKeySchema);
