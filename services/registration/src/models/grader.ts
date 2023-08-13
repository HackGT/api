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
    criteriaScores: {
      criteria: string;
      score: number;
    }[];
  }[];
  calibrationMapping: {
    criteria: string;
    scoreMappings: Map<string, number>;
  }[];
}

const graderSchema = new Schema<Grader>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
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
  calibrationScores: {
    type: [
      {
        group: {
          type: String,
          enum: Object.values(GradingGroupType),
        },
        criteriaScores: [
          {
            criteria: {
              type: String,
            },
            score: {
              type: Number,
            },
          },
        ],
      },
    ],
  },
  calibrationMapping: [
    {
      criteria: String,
      scoreMappings: {
        type: Map,
        of: Number,
      },
    },
  ],
});

graderSchema.plugin(accessibleRecordsPlugin);

export const GraderModel = model<Grader, AccessibleRecordModel<Grader>>("Grader", graderSchema);
