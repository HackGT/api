import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model } from "mongoose";

export enum PlatformType {
  EMAIL = "EMAIL",
  TEXT = "TEXT",
}

export interface Notification extends mongoose.Document {
  sender: string;
  platform: PlatformType;
  batchId?: string;
  error: boolean;
  key: string;
  payload: string;
  timestamp: Date;
}

const notificationSchema = new Schema<Notification>({
  sender: {
    type: String,
    required: true,
    index: true,
  },
  platform: {
    type: String,
    required: true,
    enum: PlatformType,
    index: true,
  },
  batchId: {
    type: String,
    index: true,
  },
  error: {
    type: Boolean,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  payload: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

notificationSchema.plugin(accessibleRecordsPlugin);

export const NotificationModel = model<Notification, AccessibleRecordModel<Notification>>(
  "Notification",
  notificationSchema
);
