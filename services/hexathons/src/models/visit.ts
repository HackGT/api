import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, Types, model } from "mongoose";

export interface Visit extends mongoose.Document {
  visitorId: string;
  hexathon: Types.ObjectId;
  company: Types.ObjectId;
  employee: string;
  starred: boolean;
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
  employee: {
    type: String,
    required: true,
    default: "",
  },
  starred: {
    type: Boolean,
    required: false,
    default: false,
  },
  tags: {
    type: [String],
    required: false,
    default: [],
  },
  notes: {
    type: [String],
    required: false,
    default: [],
  },
  time: {
    type: Date,
    required: true,
  },
});

visitSchema.plugin(accessibleRecordsPlugin);

export const VisitModel = model<Visit, AccessibleRecordModel<Visit>>("Visit", visitSchema);
