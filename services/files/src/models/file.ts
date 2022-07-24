import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { Schema, model } from "mongoose";

export interface File extends mongoose.Document {
  userId: string;
  mimeType: string;
  fileName: string;
  storageId: string;
  type: string;
}

const fileSchema = new Schema<File>({
  userId: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileName: { type: String, required: true },
  storageId: { type: String, required: true },
  type: { type: String, enum: ["resume", "other"], default: "other" },
});

fileSchema.plugin(accessibleRecordsPlugin);

export const FileModel = model<File, AccessibleRecordModel<File>>("File", fileSchema);
