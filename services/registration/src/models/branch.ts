import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { model, Schema, Types } from "mongoose";

import commonDefinitions from "../common/commonDefinitions";

export enum BranchType {
  APPLICATION = "APPLICATION",
  CONFIRMATION = "CONFIRMATION",
}

export enum ApplicationGroupType {
  PARTICIPANT = "PARTICIPANT",
  JUDGE = "JUDGE",
  MENTOR = "MENTOR",
  VOLUNTEER = "VOLUNTEER",
  SPONSOR = "SPONSOR",
  PARTNER = "PARTNER",
  STAFF = "STAFF",
}

export enum GradingGroupType {
  GENERAL_GROUP = "generalGroup",
  EMERGING_GROUP = "emergingGroup",
}

export interface Branch extends mongoose.Document {
  name: string;
  hexathon: Types.ObjectId;
  type: BranchType;
  applicationGroup: ApplicationGroupType;
  description?: string;
  settings: {
    open: Date;
    close: Date;
  };
  formPages: {
    title: string;
    jsonSchema: string;
    uiSchema: string;
  }[];
  commonDefinitionsSchema: string;
  secret: boolean;
  automaticConfirmation?: {
    enabled?: boolean;
    confirmationBranch?: Types.ObjectId;
    emails?: string[];
  };
  grading?: {
    enabled?: boolean;
    group?: GradingGroupType;
  };
  postSubmitTemplate: {
    subject: string;
    content: string;
  };
}

const branchSchema = new Schema<Branch>({
  name: {
    type: String,
    required: true,
  },
  hexathon: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: BranchType,
    index: true,
  },
  applicationGroup: {
    type: String,
    required: true,
    enum: ApplicationGroupType,
    index: true,
  },
  description: {
    type: String,
  },
  settings: {
    open: {
      type: Date,
      required: true,
    },
    close: {
      type: Date,
      required: true,
    },
  },
  formPages: {
    type: [
      {
        title: {
          type: String,
          required: true,
        },
        jsonSchema: {
          type: String,
          required: true,
        },
        uiSchema: {
          type: String,
          required: true,
        },
      },
    ],
    default: [],
    required: true,
  },
  secret: {
    type: Boolean,
    default: false,
    required: true,
  },
  automaticConfirmation: {
    enabled: {
      type: Boolean,
    },
    confirmationBranch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
    },
    emails: {
      type: [String],
    },
  },
  grading: {
    enabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    group: {
      type: String,
      enum: GradingGroupType,
    },
  },
  postSubmitTemplate: {
    subject: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
  },
});

branchSchema.plugin(accessibleRecordsPlugin);

branchSchema.virtual("commonDefinitionsSchema").get(() => JSON.stringify(commonDefinitions));

export const BranchModel = model<Branch, AccessibleRecordModel<Branch>>("Branch", branchSchema);
