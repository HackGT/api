import { Schema, model } from "mongoose";

export enum BranchType {
  APPLICATION = "application",
  CONFIRMATION = "confirmation",
}

export interface Branch {
  name: string;
  type: BranchType;
  settings: {
    open: Date;
    close: Date;
  };
  jsonSchema: object;
  uiSchema: object;
}

const branchSchema = new Schema<Branch>({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(BranchType) },
  settings: {
    open: { type: Date, required: true },
    close: { type: Date, required: true },
  },
  jsonSchema: { type: Object, required: true, default: {} },
  uiSchema: { type: Object, required: true, default: {} },
});

export const BranchModel = model<Branch>("Branch", branchSchema);
