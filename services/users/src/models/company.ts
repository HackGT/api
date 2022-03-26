import { Schema, model } from "mongoose";

export interface Company {
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

export const CompanyModel = model<Company>("Company", companySchema);
