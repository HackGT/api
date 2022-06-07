import { Schema, model } from "mongoose";

export enum BranchType {
  APPLICATION = "APPLICATION",
  CONFIRMATION = "CONFIRMATION",
}

export interface Branch {
  name: string;
  hexathon: number;
  type: BranchType;
  settings: {
    open: Date;
    close: Date;
  };
  formPages: {
    title: string;
    jsonSchema: string;
    uiSchema: string;
  }[];
}

const branchSchema = new Schema<Branch>({
  name: {
    type: String,
    required: true,
  },
  hexathon: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(BranchType),
  },
  settings: {
    open: {
      type: Date,
      required: true,
    },
    close: {
      type: Date,
      required: true,
    },
  },
  formPages: [
    {
      title: {
        type: String,
        required: true,
      },
      jsonSchema: {
        type: Object,
        required: true,
        default: {},
      },
      uiSchema: {
        type: Object,
        required: true,
        default: {},
      },
    },
  ],
});

export const BranchModel = model<Branch>("Branch", branchSchema);
