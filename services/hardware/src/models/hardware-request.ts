import { User } from "@api/common";
import mongoose, { model, ObjectId, Schema, Types } from "mongoose";

import { Item, ItemModel } from "./item";

export enum HardwareRequestStatus {
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
  ABANDONED = "ABANDONED",
  CANCELLED = "CANCELLED",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  FULFILLED = "FULFILLED",
  RETURNED = "RETURNED",
  LOST = "LOST",
  DAMAGED = "DAMAGED",
}

export interface HardwareRequest extends mongoose.Document {
  quantity: number;
  status: HardwareRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  item: Types.ObjectId;
  user: User;
}

const HardwareRequestSchema = new Schema<HardwareRequest>({
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: HardwareRequestStatus,
    required: true,
    default: HardwareRequestStatus.SUBMITTED,
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  item: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: ItemModel,
  },
  user: { type: String, required: true },
  //   user: {
  //     type: Schema.Types.ObjectId,
  //     required: true,
  //     ref: UserModel,
  //   },
});

export const HardwareRequestModel = model<HardwareRequest>(
  "HardwareRequest",
  HardwareRequestSchema
);
