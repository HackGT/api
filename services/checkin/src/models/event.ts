import { Schema, model } from "mongoose";

export interface Checkin {
  userId: string;
  eventId: mongoose.Types.ObjectId;
  status: string;
}

const checkinSchema = new Schema<Checkin>({
  userId: {
    type: String,
    required: true
  },
  eventId: {
    type: mongoose.Types.ObjectId,
    required: false
  },
  status: {
    type: String,
    default: "NOT_CHECKED_IN"
  }
});

export const CheckinModel = model<Checkin>("Checkin", checkinSchema);