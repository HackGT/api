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
    index: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  employee: {
    type: String,
    required: true,
    index: true,
  },
  starred: {
    type: Boolean,
    required: true,
    default: false,
    index: true,
  },
  tags: {
    type: [String],
    required: true,
    default: [],
    index: true,
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
