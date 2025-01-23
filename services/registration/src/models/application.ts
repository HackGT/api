import mongoose, { Schema, Types, model } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";
import { AutoPopulatedDoc } from "@api/common";
import { accessibleRecordsPlugin, AccessibleRecordModel } from "@casl/mongoose";

import { Branch, BranchModel } from "./branch";

export enum StatusType {
  DRAFT = "DRAFT",
  APPLIED = "APPLIED",
  ACCEPTED = "ACCEPTED",
  WAITLISTED = "WAITLISTED",
  CONFIRMED = "CONFIRMED",
  DENIED = "DENIED",
  NOT_ATTENDING = "NOT_ATTENDING",
}

export interface Essay extends Types.Subdocument {
  criteria: string;
  answer: string;
}

export interface Application extends mongoose.Document {
  userId: string;
  name: string;
  email: string;
  hexathon: Types.ObjectId;
  applicationBranch: AutoPopulatedDoc<Branch>;
  applicationStartTime: Date;
  applicationSubmitTime?: Date;
  applicationExtendedDeadline?: Date;
  applicationData: {
    adult?: boolean;
    dateOfBirth?: string;
    jobTitle?: string;
    company?: string;
    school?: string;
    schoolEmail?: string;
    schoolYear?: string;
    computerInfo?: string;
    graduationYear?: number;
    levelOfStudy?: string;
    countryOfResidence?: string;
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
    computerOS?: string;
    website?: string;
    linkedin?: string;
    pastExperience?: string;
    skills?: string[];
    numberOfHackathons?: number;
    travelReimbursement?: string;
    extraInfo?: string;
    confirmChecks?: Schema.Types.Mixed;
    customData?: Schema.Types.Mixed;
    essays?: Types.DocumentArray<Essay>;
    resume?: Types.ObjectId;
    matched?: boolean;
  };
  decisionData?: {
    travelReimbursement?: string;
    travelReimbursementAmount?: number;
    travelReimbursementInfoLink?: string;
  };
  confirmationBranch?: AutoPopulatedDoc<Branch>;
  confirmationSubmitTime?: Date;
  confirmationExtendedDeadline?: Date;
  status: StatusType;
  gradingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  finalScore: number;
}

const applicationSchema = new Schema<Application>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    hexathon: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    applicationBranch: {
      type: Schema.Types.ObjectId,
      ref: BranchModel,
      required: true,
      autopopulate: true,
      index: true,
    },
    applicationData: {
      adult: {
        type: Boolean,
      },
      dateOfBirth: {
        type: String,
      },
      jobTitle: {
        type: String,
      },
      company: {
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
      computerInfo: {
        type: String,
      },
      graduationYear: {
        type: String,
      },
      levelOfStudy: {
        type: String,
      },
      countryOfResidence: {
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
      computerOS: {
        type: String,
      },
      website: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      pastExperience: {
        type: String,
      },
      skills: [
        {
          type: String,
        },
      ],
      numberOfHackathons: {
        type: Number,
      },
      travelReimbursement: {
        type: String,
      },
      extraInfo: {
        type: String,
      },
      confirmChecks: {
        type: Schema.Types.Mixed,
      },
      customData: {
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
      matched: {
        type: Boolean,
        default: false,
      },
    },
    applicationStartTime: {
      type: Date,
      required: true,
    },
    applicationSubmitTime: {
      type: Date,
    },
    applicationExtendedDeadline: {
      type: Date,
    },
    decisionData: {
      travelReimbursement: {
        type: String,
      },
      travelReimbursementAmount: {
        type: Number,
      },
      travelReimbursementInfoLink: {
        type: String,
      },
    },
    confirmationBranch: {
      type: Schema.Types.ObjectId,
      ref: BranchModel,
      autopopulate: true,
      index: true,
    },
    confirmationSubmitTime: {
      type: Date,
    },
    confirmationExtendedDeadline: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      default: StatusType.DRAFT,
      enum: StatusType,
      index: true,
    },
    gradingComplete: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    finalScore: {
      type: Number,
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
