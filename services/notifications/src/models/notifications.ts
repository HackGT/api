import { Schema, model } from "mongoose";

export interface Notification {}

const notificationSchema = new Schema<Notification>({});

export const NotificationModel = model<Notification>("Notification", notificationSchema);
