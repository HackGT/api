import { Schema, model } from "mongoose";

export interface Grader {
  userId: string;
  email: string; // remove this, use apiCall() to users/_id to get email
  graded: number;
  skipped: number | undefined;
  group: string;
  groupsLeft: string[];
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
  userId: String,
  email: String,
  graded: Number,
  skipped: Number,
  calibrationScores: [
    {
      group: String,
      score: Number,
    },
  ],
  group: {
    type: String,
    required: false,
  },
  groupsLeft: [
    {
      type: String,
      required: false,
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

export const GraderModel = model<Grader>("Grader", graderSchema);
