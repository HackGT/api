import mongoose, { Schema, model } from "mongoose";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
interface RootDocument {
  _id: mongoose.Types.ObjectId;
}
export function createNew<T extends RootDocument>(
  model: mongoose.Model<T & mongoose.Document, {}>,
  doc: Omit<T, "_id">
) {
  return new model(doc);
}

export interface Checkin extends RootDocument {
  userId: string;
  eventId: mongoose.Types.ObjectId;
  status: string;
}

const checkinSchema = new Schema<Checkin & mongoose.Document>({
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

export const CheckinModel = model<Checkin & mongoose.Document>("Checkin", checkinSchema);
