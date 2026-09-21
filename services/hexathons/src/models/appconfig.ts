import mongoose, { Schema, Types, model } from "mongoose";

export interface AppConfig extends mongoose.Document {
  globalHexathonId?: Types.ObjectId;
  overrides: Map<string, Types.ObjectId>;
}

const appConfigSchema = new Schema<AppConfig>(
  {
    _id: {
      type: String,
      default: "current",
    },
    globalHexathonId: {
      type: Schema.Types.ObjectId,
      ref: "Hexathon",
    },
    overrides: {
      type: Map,
      of: {
        type: Schema.Types.ObjectId,
        ref: "Hexathon",
      },
      default: {},
    },
  },
  { timestamps: true }
);

export const AppConfigModel = model<AppConfig>("AppConfig", appConfigSchema);
