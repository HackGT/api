import { Schema, model, Types } from "mongoose";

export interface Checkin {
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

export const CheckinModel = model<Checkin>("Checkin", checkinSchema);
