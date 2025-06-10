import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";
import { AutoPopulatedDoc } from "@api/common";

import { HexathonModel } from "./hexathon";
import { Location, LocationModel } from "./location";
import { Tag, TagModel } from "./tag";

export enum EventType {
  FOOD = "food",
  WORKSHOP = "workshop",
  CEREMONY = "ceremony",
  TECH_TALK = "tech-talk",
  MINI_EVENT = "mini-event",
  IMPORTANT = "important",
  SPEAKER = "speaker",
  MINI_CHALLENGE = "mini-challenge",
}

export interface Event extends mongoose.Document {
  hexathon: Types.ObjectId;
  name: string;
  type: EventType;
  description: string;
  startDate: Date;
  endDate: Date;
  location: AutoPopulatedDoc<Location>[];
  tags: AutoPopulatedDoc<Tag>[];
  checkIns: number;
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
    enum: Object.values(EventType),
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    default: " ",
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
    type: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: LocationModel,
        autopopulate: true,
        index: true,
      },
    ],
    default: [],
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
  checkIns: {
    type: Number,
    required: false,
    default: 0,
  },
});

eventSchema.plugin(mongooseAutopopulate);
eventSchema.plugin(accessibleRecordsPlugin);

export const EventModel = model<Event, AccessibleRecordModel<Event>>("Event", eventSchema);
