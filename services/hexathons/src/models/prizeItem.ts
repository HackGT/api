import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";

export interface PrizeItem extends mongoose.Document {
  name: string;
  hexathon: Types.ObjectId;
  number: number;
  capacity: number;
  points: number;
  description: string;
  image: string;
  status: string;
  shippable: boolean;
  totalNumRequested: number;
  location: string;
  image_url: string;
}

const prizeItemSchema = new Schema<PrizeItem>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
  },
  number: {
    type: Number,
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
  totalNumRequested: {
    type: Number,
    required: true,
    default: 0,
  },
  location: {
    type: String,
  },
  image_url: {
    type: String,
    default: "",
  },
});

prizeItemSchema.plugin(accessibleRecordsPlugin);

export const PrizeItemModel = model<PrizeItem, AccessibleRecordModel<PrizeItem>>(
  "PrizeItem",
  prizeItemSchema
);
