import { Schema, model } from "mongoose";

interface Item {
  id: string;
  name: string;
  shop_id: string;
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

const itemSchema = new Schema<Item>({
  id: {
    type: String,
    required: false,
    unique: false,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  shop_id: {
    type: String,
    required: false,
  },
  number: {
    type: Number,
    required: false,
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
    required: false,
    unique: false,
  },
  status: {
    type: String,
    required: false,
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
    required: false,
  },
  image_url: {
    type: String,
    required: false,
    default: "",
  },
});

export const ItemModel = model<Item>("Item", itemSchema);
