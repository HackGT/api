import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";
import { PrizeItemModel } from "./prizeItem";

export interface HexathonUser extends mongoose.Document {
  userId: string;
  email: string;
  name: string;
  hexathon: Types.ObjectId;
  points: {
    currentTotal: number;
    numCollected: number;
    numSpent: number;
    numAdditional: number;
    lastUpdated: Date;
  };
  address?: string;
  validAddress?: boolean;
  trackingLabel?: string;
  purchasedPrizeItems: {
    prizeItemId: Types.ObjectId;
    quantity: number;
    timestamp: Date;
  }[];
}

const hexathonUserSchema = new Schema<HexathonUser>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
  },
  points: {
    numCollected: {
      type: Number,
      required: true,
      default: 0,
    },
    numSpent: {
      type: Number,
      required: true,
      default: 0,
    },
    numAdditional: {
      type: Number,
      required: true,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: new Date(),
    },
  },
  address: {
    type: String,
  },
  validAddress: {
    type: Boolean,
  },
  trackingLabel: {
    type: String,
  },
  purchasedPrizeItems: {
    type: [
      {
        prizeItemId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: PrizeItemModel,
        },
        quantity: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
      },
    ],
    default: [],
  },
});

hexathonUserSchema.plugin(accessibleRecordsPlugin);

hexathonUserSchema.virtual("points.currentTotal").get(function get(this: HexathonUser) {
  return Math.max(0, this.points.numCollected - this.points.numSpent + this.points.numAdditional);
});

export const HexathonUserModel = model<HexathonUser, AccessibleRecordModel<HexathonUser>>(
  "HexathonUser",
  hexathonUserSchema
);
