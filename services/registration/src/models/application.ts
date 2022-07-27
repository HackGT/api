import mongoose, { Schema, Types, Mixed, model } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";
import { AutoPopulatedDoc } from "@api/common";
import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";

import { Branch, BranchModel } from "./branch";

export enum StatusType {
  DRAFT = "DRAFT",
  APPLIED = "APPLIED",
  ACCEPTED = "ACCEPTED",
  CONFIRMED = "CONFIRMED",
  DENIED = "DENIED",
}

export interface Essay extends Types.Subdocument {
  criteria: string;
  answer: string;
}

export interface Application extends mongoose.Document {
  userId: string;
  hexathon: Types.ObjectId;
  applicationBranch: AutoPopulatedDoc<Branch>;
  applicationStartTime: Date;
  applicationSubmitTime?: Date;
  applicationData: {
    adult?: boolean;
    occupation?: string;
    school?: string;
    schoolEmail?: string;
    schoolYear?: string;
    graduationYear?: number;
    major?: string;
    shirtSize?: string;
    dietaryRestrictions?: string[];
    allergies?: string;
    phoneNumber?: string;
    gender?: string;
    ethnicity?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zip?: number;
      country?: string;
    };
    marketing?: string;
    website?: string;
    linkedin?: string;
    extraInfo?: string;
    confirmChecks?: Schema.Types.Mixed;
    essays?: Types.DocumentArray<Essay>;
    resume?: Types.ObjectId;
  };
  confirmationBranch?: AutoPopulatedDoc<Branch>;
  confirmationStartTime?: Date;
  confirmationSubmitTime?: Date;
  confirmationData?: Mixed;
  status: StatusType;
  gradingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<Application>(
  {
    userId: {
      type: String,
      required: true,
    },
    hexathon: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    applicationBranch: {
      type: Schema.Types.ObjectId,
      ref: BranchModel,
      required: true,
      autopopulate: true,
    },
    applicationData: {
      adult: {
        type: Boolean,
      },
      occupation: {
        type: String,
      },
      school: {
        type: String,
      },
      schoolEmail: {
        type: String,
      },
      schoolYear: {
        type: String,
      },
      graduationYear: {
        type: String,
      },
      major: {
        type: String,
      },
      shirtSize: {
        type: String,
      },
      dietaryRestrictions: [
        {
          type: String,
        },
      ],
      allergies: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
      gender: {
        type: String,
      },
      ethnicity: {
        type: String,
      },
      address: {
        line1: {
          type: String,
        },
        line2: {
          type: String,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        zip: {
          type: Number,
        },
        country: {
          type: String,
        },
      },
      marketing: {
        type: String,
      },
      website: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      extraInfo: {
        type: String,
      },
      confirmChecks: {
        type: Schema.Types.Mixed,
      },
      essays: [
        {
          criteria: {
            type: String,
            required: true,
          },
          answer: {
            type: String,
            required: true,
          },
        },
      ],
      resume: {
        type: Schema.Types.ObjectId,
      },
    },
    applicationStartTime: {
      type: Date,
      required: true,
    },
    applicationSubmitTime: {
      type: Date,
    },
    confirmationBranch: {
      type: Schema.Types.ObjectId,
      ref: BranchModel,
      autopopulate: true,
    },
    confirmationData: {
      type: Schema.Types.Mixed,
    },
    confirmationStartTime: {
      type: Date,
    },
    confirmationSubmitTime: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      default: StatusType.DRAFT,
      enum: StatusType,
    },
    gradingComplete: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.plugin(mongooseAutopopulate);
applicationSchema.plugin(accessibleRecordsPlugin);

export const ApplicationModel = model<Application, AccessibleRecordModel<Application>>(
  "Application",
  applicationSchema
);
