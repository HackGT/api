import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, Types, model } from "mongoose";

export interface SponsorVisit extends mongoose.Document {
  visitorId: string;
  hexathon: Types.ObjectId;
  company: Types.ObjectId;
  employee: string;
  starred: boolean;
  tags: string[];
  notes: string[];
  scannerId?: string;
  time: Date;
}

const sponsorVisitSchema = new Schema<SponsorVisit>({
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
  },
  starred: {
    type: Boolean,
    required: true,
    default: false,
  },
  tags: {
    type: [String],
    required: true,
    default: [],
  },
  notes: {
    type: [String],
    required: true,
    default: [],
  },
  scannerId: {
    type: String,
  },
  time: {
    type: Date,
    required: true,
  },
});

sponsorVisitSchema.plugin(accessibleRecordsPlugin);

export const SponsorVisitModel = model<SponsorVisit, AccessibleRecordModel<SponsorVisit>>(
  "SponsorVisit",
  sponsorVisitSchema
);
