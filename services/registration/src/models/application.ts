import { Schema, Types, Mixed, PaginateModel, model } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";
import mongoosePaginate from "mongoose-paginate-v2";
import { AutoPopulatedDoc } from "@api/common";

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

export interface Application {
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
    dietaryRestrictions?: string;
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
    extraInfo?: [Schema.Types.Mixed];
    confirmChecks?: Schema.Types.Mixed;
    essays?: Types.DocumentArray<Essay>;
  };
  confirmationBranch?: AutoPopulatedDoc<Branch>;
  confirmationStartTime?: Date;
  confirmationSubmitTime?: Date;
  confirmationData?: Mixed;
  status: StatusType;
  finalScore?: number;
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
      dietaryRestrictions: {
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
        type: Schema.Types.Array,
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
    finalScore: {
      type: Number,
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
applicationSchema.plugin(mongoosePaginate);

export const ApplicationModel = model<Application, PaginateModel<Application>>(
  "Application",
  applicationSchema
);
