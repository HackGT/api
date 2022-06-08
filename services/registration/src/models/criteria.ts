import { Schema, model } from "mongoose";

export interface Review {
  [key: string]: any;
  by: {
    userId: string;
    time: Date;
  };
  score: number;
  adjustedScore: number;
}

export interface ResponseData {
  [key: string]: string;
  question: string;
  answer: string;
}

export interface Criteria {
  applicationID: string;
  track: string;
  name: string;
  data: ResponseData[];
  review: Review[];
  botReview: number | undefined;
  done: boolean;
  finalscore: number | undefined;
  updatedAt: Date | undefined;
}

const criteriaSchema = new Schema<Criteria>({
  applicationID: String,
  name: String,
  track: String,
  data: [
    {
      question: String,
      answer: String,
    },
  ],
  review: [
    {
      reviewerId: String,
      score: Number,
      adjustedScore: Number,
    },
  ],
  botReview: {
    type: Number,
    required: false,
  },
  done: Boolean,
  finalscore: {
    type: Number,
    required: false,
  },
  updatedAt: {
    type: Date,
    required: false,
  },
});

export const CriteriaModel = model<Criteria>("Criteria", criteriaSchema);
