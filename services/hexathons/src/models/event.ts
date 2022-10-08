import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";

import { HexathonModel } from "./hexathon";
import { InteractionEventType } from "./interaction";

export interface Event extends mongoose.Document {
  hexathon: Types.ObjectId;
  name: string;
  type: InteractionEventType;
  startDate: Date;
  endDate: Date;
  location: string;
  tags?: string[];
}

const eventSchema = new Schema<Event>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(InteractionEventType),
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  tags: {
    type: [
      {
        type: String,
      },
    ],
  },
});

eventSchema.plugin(accessibleRecordsPlugin);

export const EventModel = model<Event, AccessibleRecordModel<Event>>("Event", eventSchema);
