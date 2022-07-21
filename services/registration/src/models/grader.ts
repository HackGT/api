import { Schema, model } from "mongoose";

export interface Grader {
  userId: string;
  graded: number;
  skipped: number;
  currentGradingGroup?: string;
  completedGradingGroups: string[];
  calibrationScores: {
    group: string;
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
      group: String,
      score: Number,
    },
  ],
  currentGradingGroup: {
    type: String,
  },
  completedGradingGroups: {
    type: [String],
    default: [],
    required: true,
  },
  calibrationMapping: [
    {
      criteria: String,
      scoreMappings: {
        number: Number,
      },
    },
  ],
});

export const GraderModel = model<Grader>("Grader", graderSchema);
