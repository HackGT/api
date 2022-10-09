import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

export interface Company extends mongoose.Document {
  name: string;
  description: string;
  hexathon: Types.ObjectId;
  defaultEmailDomains: string[];
  hasResumeAccess: boolean;
  employees: string[];
  pendingEmployees: string[];
}

const companySchema = new Schema<Company>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    default: "",
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  defaultEmailDomains: {
    type: [String],
    required: true,
    default: [],
  },
  hasResumeAccess: {
    type: Boolean,
    required: true,
    default: false,
  },
  employees: {
    type: [String],
    required: true,
    default: [],
  },
  pendingEmployees: {
    type: [String],
    required: true,
    default: [],
  },
});

companySchema.plugin(accessibleRecordsPlugin);

export const CompanyModel = model<Company, AccessibleRecordModel<Company>>(
  "Company",
  companySchema
);
