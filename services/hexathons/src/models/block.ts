import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";

export interface Block extends mongoose.Document {
  hexathon: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  display: string;
}

const blockSchema = new Schema<Block>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  display: {
    type: String,
  },
});

blockSchema.plugin(accessibleRecordsPlugin);

export const BlockModel = model<Block, AccessibleRecordModel<Block>>("Block", blockSchema);
