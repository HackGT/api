import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { model, Schema, Types } from "mongoose";

import { BranchModel } from "./branch";

export interface Email extends mongoose.Document {
  hexathon: Types.ObjectId;
  filter: {
    applicationBranchList: Types.ObjectId[];
    confirmationBranchList: Types.ObjectId[];
    statusList: string[];
  };
  sender: string;
  recipients: string[];
  message: string;
  subject: string;
  timestamp: Date;
}

const emailSchema = new Schema<Email>({
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  filter: {
    applicationBranchList: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: BranchModel,
    },
    confirmationBranchList: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: BranchModel,
    },
    statusList: {
      type: [String],
      required: true,
    },
  },
  sender: {
    type: String,
    required: true,
  },
  recipients: {
    type: [String],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

emailSchema.plugin(accessibleRecordsPlugin);

export const EmailModel = model<Email, AccessibleRecordModel<Email>>("Email", emailSchema);
