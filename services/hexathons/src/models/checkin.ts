import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

export interface Checkin extends mongoose.Document {
  userId: string;
  status: string;
  hexathon: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const checkinSchema = new Schema<Checkin>(
  {
    userId: {
      type: String,
      required: true,
    },
    hexathon: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      default: "NOT_CHECKED_IN",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

checkinSchema.plugin(accessibleRecordsPlugin);

export const CheckinModel = model<Checkin, AccessibleRecordModel<Checkin>>(
  "Checkin",
  checkinSchema
);
