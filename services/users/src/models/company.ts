import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model } from "mongoose";

export interface Company extends mongoose.Document {
  name: string;
  defaultEmailDomains: string[];
  hasResumeAccess: boolean;
  employees: string[];
}

const companySchema = new Schema<Company>({
  name: {
    type: String,
    required: true,
  },
  defaultEmailDomains: {
    type: [String],
    default: [],
  },
  hasResumeAccess: {
    type: Boolean,
    default: false,
  },
  employees: {
    type: [String],
    default: [],
  },
});

companySchema.plugin(accessibleRecordsPlugin);

export const CompanyModel = model<Company, AccessibleRecordModel<Company>>(
  "Company",
  companySchema
);
