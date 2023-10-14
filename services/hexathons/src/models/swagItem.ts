import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";

export interface SwagItem extends mongoose.Document {
  name: string;
  hexathon: Types.ObjectId;
  purchased: number;
  capacity: number;
  points: number;
  description: string;
  image: string;
  status: string;
  shippable: boolean;
  location: string;
  image_url: string;
}

const swagItemSchema = new Schema<SwagItem>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
    index: true,
  },
  purchased: {
    type: Number,
    default: 0,
  },
  capacity: {
    type: Number,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    unique: false,
  },
  image: {
    type: String,
  },
  status: {
    type: String,
  },
  shippable: {
    type: Boolean,
    default: true,
    required: true,
  },
  location: {
    type: String,
  },
  image_url: {
    type: String,
    default: "",
  },
});

swagItemSchema.plugin(accessibleRecordsPlugin);

export const SwagItemModel = model<SwagItem, AccessibleRecordModel<SwagItem>>(
  "SwagItem",
  swagItemSchema
);
