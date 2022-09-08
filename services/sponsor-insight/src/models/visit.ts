import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, Types, model } from "mongoose";

export interface Visit extends mongoose.Document {
  visitorId: string;
  hexathon: Types.ObjectId;
  company: Types.ObjectId;
  employees: string[];
  tags: string[];
  notes: string[];
  scannerID?: string;
  time: Date;
}

const visitSchema = new Schema<Visit>({
  visitorId: {
    type: String,
    required: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  employees: {
    type: [String],
    required: true,
    default: []
  },
  tags: {
    type: [String],
    required: false,
    default: []
  },
  notes: {
    type: [String],
    required: false,
    default: []
  },
  scannerID: {
    type: String,
  },
  time: {
    type: Date,
    required: true,
  },
});

visitSchema.plugin(accessibleRecordsPlugin);

export const VisitModel = model<Visit, AccessibleRecordModel<Visit>>("Visit", visitSchema);
