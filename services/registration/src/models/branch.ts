import { model, Schema, Types } from "mongoose";

export enum BranchType {
  APPLICATION = "APPLICATION",
  CONFIRMATION = "CONFIRMATION",
}

export interface Branch {
  name: string;
  hexathon: Types.ObjectId;
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
    type: Schema.Types.ObjectId,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: BranchType,
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
        type: String,
        required: true,
      },
      uiSchema: {
        type: String,
        required: true,
      },
    },
  ],
});

export const BranchModel = model<Branch>("Branch", branchSchema);
