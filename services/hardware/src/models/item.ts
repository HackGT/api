import mongoose, { model, Model, ObjectId, Schema, Types } from "mongoose";

import { Category, CategoryModel } from "./category";
import { Location, LocationModel } from "./location";

export interface Item extends mongoose.Document {
  name: string;
  description: string;
  imageUrl?: string;
  totalAvailable: number;
  maxRequestQty: number;
  price: Types.Decimal128;
  hidden: boolean;
  returnRequired: boolean;
  approvalRequired: boolean;
  owner: string;
  category: ObjectId;
  location: ObjectId;
  requests: Types.ObjectId[];
}

const itemSchema = new Schema<Item>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  totalAvailable: {
    type: Number,
    required: true,
  },
  maxRequestQty: {
    type: Number,
    required: true,
  },
  price: {
    type: Types.Decimal128,
    required: true,
  },
  hidden: {
    type: Boolean,
    required: true,
    default: false,
  },
  returnRequired: {
    type: Boolean,
    required: true,
    default: true,
  },
  approvalRequired: {
    type: Boolean,
    required: true,
    default: true,
  },
  owner: {
    type: String,
    required: true,
  },
  category: {
    type: Types.ObjectId,
    required: true,
    ref: CategoryModel,
  },
  location: {
    type: Types.ObjectId,
    required: true,
    ref: LocationModel,
  },
  requests: {
    type: [Types.ObjectId],
    required: true,
    default: [],
  },
});

export const ItemModel = model<Item>("Item", itemSchema);
