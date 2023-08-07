import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";
import { commonDefinitions } from "@api/common";

import { HexathonModel } from "./hexathon";
import { SwagItemModel } from "./swagItem";

export enum CommitmentType {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

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
  purchasedSwagItems: {
    swagItemId: Types.ObjectId;
    quantity: number;
    timestamp: Date;
  }[];
  profile: {
    matched: boolean;
    school?: string;
    year?: string;
    major?: string;
    description?: string;
    commitmentLevel?: CommitmentType;
    skills?: string[];
    isJudging?: boolean;
  };
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
    index: true,
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
  purchasedSwagItems: {
    type: [
      {
        swagItemId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: SwagItemModel,
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
  profile: {
    matched: {
      type: Boolean,
      required: true,
      default: false,
    },
    school: {
      type: String,
      enum: commonDefinitions.university.enum,
    },
    year: {
      type: String,
      enum: commonDefinitions.year.enum,
    },
    major: {
      type: String,
      enum: commonDefinitions.major.enum,
    },
    description: {
      type: String,
      maxLength: 200,
    },
    commitmentLevel: {
      type: String,
      enum: Object.values(CommitmentType),
    },
    skills: {
      type: [String],
      enum: commonDefinitions.skills.enum,
    },
    isJudging: {
      type: Boolean,
      default: false,
    },
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
