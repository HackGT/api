import { AccessibleRecordModel, accessibleRecordsPlugin } from "@casl/mongoose";
import mongoose, { model, Schema, Types } from "mongoose";

export enum ReferralStatusType {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
}

export interface Referral extends mongoose.Document {
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  hexathon: Types.ObjectId;
  referralData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    school?: string;
    schoolYear?: string;
    referForReimbursement?: boolean;
    referForEarlyApplication?: boolean;
    resume?: Types.ObjectId;
    essay?: string;
  };
  referralStartTime: Date;
  referralSubmitTime?: Date;
  status: ReferralStatusType;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<Referral>(
  {
    referrerId: {
      type: String,
      required: true,
      index: true,
    },
    referrerName: {
      type: String,
      required: true,
      index: true,
    },
    referrerEmail: {
      type: String,
      required: true,
      index: true,
    },
    hexathon: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    referralData: {
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      email: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
      school: {
        type: String,
      },
      schoolYear: {
        type: String,
      },
      referForReimbursement: {
        type: Boolean,
      },
      referForEarlyApplication: {
        type: Boolean,
      },
      resume: {
        type: Schema.Types.ObjectId,
      },
      essay: {
        type: String,
      },
    },
    referralStartTime: {
      type: Date,
      required: true,
    },
    referralSubmitTime: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      default: ReferralStatusType.DRAFT,
      enum: ReferralStatusType,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

referralSchema.plugin(accessibleRecordsPlugin);

export const ReferralModel = model<Referral, AccessibleRecordModel<Referral>>(
  "Referral",
  referralSchema
);
