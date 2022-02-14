import { Schema, model } from "mongoose";

export interface Branch {
  name: string;
  type: string;
  settings: {
    open: Date;
    close: Date;
  };
}

const branchSchema = new Schema<Branch>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  settings: {
    open: { type: Date, required: true },
    close: { type: Date, required: true },
  },
});

export const BranchModel = model<Branch>("Branch", branchSchema);
