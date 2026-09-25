import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model, Types } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";
import { AutoPopulatedDoc } from "@api/common";

import { HexathonModel } from "./hexathon";
import { Location, LocationModel } from "./location";
import { Tag, TagModel } from "./tag";

export interface VolunteerShift extends mongoose.Document {
  hexathon: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  location: AutoPopulatedDoc<Location>[];
  tags: AutoPopulatedDoc<Tag>[];
  assignees: string[];
}

const volunteerShiftSchema = new Schema<VolunteerShift>({
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
  assignees: {
    type: [
      {
        type: String,
        required: true,
        index: true,
      },
    ],
    default: [],
  },
});

volunteerShiftSchema.plugin(mongooseAutopopulate);
volunteerShiftSchema.plugin(accessibleRecordsPlugin);

export const VolunteerShiftModel = model<VolunteerShift, AccessibleRecordModel<VolunteerShift>>(
  "VolunteerShift",
  volunteerShiftSchema
);
