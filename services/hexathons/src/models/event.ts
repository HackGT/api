import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";
import { AutoPopulatedDoc } from "@api/common";

import { HexathonModel } from "./hexathon";
import { Location, LocationModel } from "./location";
import { Tag, TagModel } from "./tag";
import { InteractionEventType } from "./interaction";

export interface Event extends mongoose.Document {
  hexathon: Types.ObjectId;
  name: string;
  type: InteractionEventType;
  startDate: Date;
  endDate: Date;
  location: AutoPopulatedDoc<Location>;
  tags: AutoPopulatedDoc<Tag>[];
}

const eventSchema = new Schema<Event>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: HexathonModel,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(InteractionEventType),
    required: true,
    index: true,
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
    type: Schema.Types.ObjectId,
    required: true,
    ref: LocationModel,
    autopopulate: true,
    index: true,
  },
  tags: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: TagModel,
        autopopulate: true,
        index: true,
      },
    ],
    default: [],
  },
});

eventSchema.plugin(mongooseAutopopulate);
eventSchema.plugin(accessibleRecordsPlugin);

export const EventModel = model<Event, AccessibleRecordModel<Event>>("Event", eventSchema);
