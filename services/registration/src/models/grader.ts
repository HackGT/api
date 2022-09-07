import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { GradingGroupType } from "./branch";

export interface Grader extends mongoose.Document {
  userId: string;
  hexathon: Types.ObjectId;
  graded: number;
  skipped: number;
  calibrationScores: {
    group: GradingGroupType;
    score: number;
  }[];
  calibrationMapping: {
    criteria: string;
    scoreMappings: {
      [key: number]: number; // score -> mappedScore
    };
  }[];
}

const graderSchema = new Schema<Grader>({
  userId: {
    type: String,
    required: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  graded: {
    type: Number,
    required: true,
    default: 0,
  },
  skipped: {
    type: Number,
    required: true,
    default: 0,
  },
  calibrationScores: [
    {
      group: {
        type: String,
        enum: GradingGroupType,
      },
      score: Number,
    },
  ],
  calibrationMapping: [
    {
      criteria: String,
      scoreMappings: {
        number: Number,
      },
    },
  ],
});

graderSchema.plugin(accessibleRecordsPlugin);

export const GraderModel = model<Grader, AccessibleRecordModel<Grader>>("Grader", graderSchema);
