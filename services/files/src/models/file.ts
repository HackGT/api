import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model } from "mongoose";

export interface File extends mongoose.Document {
  userId: string;
  mimeType: string;
  name: string;
  storageId: string;
  storageBucket?: string;
  type: string;
}

const fileSchema = new Schema<File>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  storageId: {
    type: String,
    required: true,
  },
  storageBucket: {
    type: String,
  },
  type: {
    type: String,
    enum: ["resume", "finance", "other"],
    default: "other",
  },
});

fileSchema.plugin(accessibleRecordsPlugin);

export const FileModel = model<File, AccessibleRecordModel<File>>("File", fileSchema);
