import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";

export interface Tag extends mongoose.Document {
  hexathon: Types.ObjectId;
  name: string;
}

const tagSchema = new Schema<Tag>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
  },
  name: {
    type: String,
    required: true,
  },
});

tagSchema.plugin(accessibleRecordsPlugin);

export const TagModel = model<Tag, AccessibleRecordModel<Tag>>("Tag", tagSchema);
