import { User } from "@api/common";
import mongoose, { model, ObjectId, Schema, Types } from "mongoose";

import { Item, ItemModel } from "./item";

export enum RequestStatus {
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

export interface Request extends mongoose.Document {
  quantity: number;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  item: Types.ObjectId;
  user: User;
}

const RequestSchema = new Schema<Request>({
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: RequestStatus,
    required: true,
    default: RequestStatus.SUBMITTED,
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
  user: { type: Schema.Types.Mixed, required: true },
  //   user: {
  //     type: Schema.Types.ObjectId,
  //     required: true,
  //     ref: UserModel,
  //   },
});

export const RequestModel = model<Request>("Request", RequestSchema);
