import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";
import mongoose, { Schema, model } from "mongoose";

export interface Notification extends mongoose.Document {}

const notificationSchema = new Schema<Notification>({});

notificationSchema.plugin(accessibleRecordsPlugin);

export const NotificationModel = model<Notification, AccessibleRecordModel<Notification>>(
  "Notification",
  notificationSchema
);
