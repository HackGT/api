import { Schema, model } from "mongoose";

export interface File {
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

export const FileModel = model<File>("File", fileSchema);
