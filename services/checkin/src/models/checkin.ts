import { Schema, model, Types } from "mongoose";

export interface Checkin {
  user: string;
  status: string;
  event: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const checkinSchema = new Schema<Checkin>(
  {
    user: {
      type: String,
      required: true,
    },
    event: {
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

export const CheckinModel = model<Checkin>("Checkin", checkinSchema);
