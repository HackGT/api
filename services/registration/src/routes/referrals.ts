import { apiCall, asyncHandler, BadRequestError, checkAbility, getFullName } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import _ from "lodash";
import { FilterQuery, isValidObjectId, Types } from "mongoose";

import { validateReferralData } from "../common/util";
import { Referral, ReferralModel, ReferralStatusType } from "../models/referral";
import { ApplicationModel, StatusType } from "../models/application";
import { REFERRAL_BONUS } from "../common/adjustScores";

export const referralRouter = express.Router();

/*
  The referral bonus gets applied after the last grader's review is submitted,
  this handles the cases where someone is referred after their application is graded
*/
async function applyReferralBonus(
  email?: string,
  hexathon?: Types.ObjectId,
  referralId?: Types.ObjectId
) {
  if (!email || !hexathon || !referralId) {
    return;
  }

  const emailRegex = new RegExp(`^${_.escapeRegExp(email.trim())}$`, "i");

  const application = await ApplicationModel.findOne({
    hexathon,
    email: emailRegex,
    status: { $ne: StatusType.DRAFT },
  });

  if (!application || !application.gradingComplete) {
    return;
  }

  const alreadyHasBonus = await ReferralModel.exists({
    hexathon,
    "referralData.email": emailRegex,
    "status": ReferralStatusType.SUBMITTED,
    "_id": { $ne: referralId },
  });
  if (alreadyHasBonus) {
    return;
  }

  application.finalScore += REFERRAL_BONUS;
  await application.save();
}

referralRouter.route("/actions/create-referral").post(
  checkAbility("create", "Referral"),
  asyncHandler(async (req, res) => {
    if (!req.body.hexathon) {
      throw new BadRequestError("Hexathon is required.");
    }

    const userInfo = await apiCall(
      Service.USERS,
      { method: "GET", url: `users/${req.user?.uid}` },
      req
    );

    if (!userInfo || Object.keys(userInfo).length === 0) {
      throw new BadRequestError("User not found.");
    }

    const newReferral = await ReferralModel.create({
      referrerId: req.user?.uid,
      referrerName: getFullName(userInfo.name),
      referrerEmail: userInfo.email,
      hexathon: req.body.hexathon,
      referralData: {},
      referralStartTime: new Date(),
      status: ReferralStatusType.DRAFT,
    });

    return res.status(200).send(newReferral);
  })
);

referralRouter.route("/").get(
  checkAbility("read", "Referral"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Referral> = {
      hexathon: req.query.hexathon,
    };

    if (req.query.mine === "true") {
      filter.referrerId = req.user?.uid;
    }

    if (req.query.status?.length) {
      filter.status = req.query.status;
    }

    if (req.query.search && typeof req.query.search === "string") {
      const search = req.query.search.trim().slice(0, 75);
      if (search) {
        const sanitizedSearch = _.escapeRegExp(search);
        const searchRegex = new RegExp(sanitizedSearch, "i");
        const searchFilters: FilterQuery<Referral>[] = [
          { referrerId: { $regex: searchRegex } },
          { referrerName: { $regex: searchRegex } },
          { referrerEmail: { $regex: searchRegex } },
          { "referralData.firstName": { $regex: searchRegex } },
          { "referralData.lastName": { $regex: searchRegex } },
          { "referralData.email": { $regex: searchRegex } },
          { "referralData.school": { $regex: searchRegex } },
        ];

        if (isValidObjectId(search)) {
          searchFilters.unshift({ _id: new Types.ObjectId(search) });
        }

        filter.$or = searchFilters;
      }
    }

    const matchCount = await ReferralModel.accessibleBy(req.ability).find(filter).count();

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const referrals = await ReferralModel.accessibleBy(req.ability)
      .find(filter)
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      offset,
      total: matchCount,
      count: referrals.length,
      referrals,
    });
  })
);

referralRouter.route("/:id").get(
  checkAbility("read", "Referral"),
  asyncHandler(async (req, res) => {
    const referral = await ReferralModel.findById(req.params.id).accessibleBy(req.ability);

    if (!referral) {
      throw new BadRequestError("Referral not found or you do not have permission to access.");
    }

    const referralData = { ...referral.referralData } as any;
    if (referralData.resume) {
      referralData.resume = await apiCall(
        Service.FILES,
        {
          method: "GET",
          url: `files/${referralData.resume}`,
          params: {
            hexathon: referral.hexathon.toString(),
          },
        },
        req
      );
    }

    return res.send({
      ...referral.toJSON(),
      referralData,
    });
  })
);

referralRouter.route("/:id").delete(
  asyncHandler(async (req, res) => {
    const referral = await ReferralModel.findById(req.params.id).accessibleBy(req.ability);

    if (!referral) {
      throw new BadRequestError("Referral not found or you do not have permission to delete.");
    }

    if (referral.referrerId !== req.user?.uid && !req.user?.roles.admin) {
      throw new BadRequestError("You do not have permission to delete this referral.");
    }

    /*
    if (referral.status !== ReferralStatusType.DRAFT) {
      throw new BadRequestError("You can only delete a referral if the status is a draft.");
    }
      */

    await ReferralModel.findByIdAndDelete(req.params.id);
    return res.json({ message: "Referral deleted successfully." });
  })
);

referralRouter.route("/:id/actions/save-referral-data").post(
  checkAbility("update", "Referral"),
  asyncHandler(async (req, res) => {
    const existingReferral = await ReferralModel.findById(req.params.id).accessibleBy(req.ability);

    if (!existingReferral) {
      throw new BadRequestError("No referral exists with this id or you do not have permission.");
    }

    const incomingReferralData = req.body.referralData ?? {};
    let { resume } = existingReferral.referralData;
    if (Object.prototype.hasOwnProperty.call(incomingReferralData, "resume")) {
      resume = incomingReferralData.resume?.id || undefined;
    }

    const allowedReferralData = _.pick(req.body.referralData ?? {}, [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "school",
      "schoolYear",
      "referForReimbursement",
      "referForEarlyApplication",
      "essay",
    ]);

    const nextReferralData = {
      ...existingReferral.referralData,
      ...allowedReferralData,
      resume,
    };

    let hydratedResume;
    if (existingReferral.status === ReferralStatusType.SUBMITTED) {
      if (resume) {
        hydratedResume = await apiCall(
          Service.FILES,
          {
            method: "GET",
            url: `files/${resume}`,
            params: {
              hexathon: existingReferral.hexathon.toString(),
            },
          },
          req
        );
      }

      await validateReferralData({
        ...nextReferralData,
        resume: hydratedResume,
      });
    }

    const updatedReferral = await ReferralModel.findByIdAndUpdate(
      req.params.id,
      {
        referralData: nextReferralData,
      },
      { new: true, runValidators: true }
    );

    if (!updatedReferral) {
      throw new BadRequestError("Error saving referral data.");
    }

    const referralData = { ...updatedReferral.referralData } as any;
    if (referralData.resume) {
      referralData.resume =
        hydratedResume ??
        (await apiCall(
          Service.FILES,
          {
            method: "GET",
            url: `files/${referralData.resume}`,
            params: {
              hexathon: updatedReferral.hexathon.toString(),
            },
          },
          req
        ));
    }

    return res.send({
      ...updatedReferral.toJSON(),
      referralData,
    });
  })
);

referralRouter.route("/:id/actions/submit-referral").post(
  checkAbility("update", "Referral"),
  asyncHandler(async (req, res) => {
    const existingReferral = await ReferralModel.findById(req.params.id).accessibleBy(req.ability);

    if (!existingReferral) {
      throw new BadRequestError("No referral exists with this id or you do not have permission.");
    }

    if (existingReferral.status !== ReferralStatusType.DRAFT) {
      throw new BadRequestError("This referral has already been submitted.");
    }

    let resume;
    if (existingReferral.referralData.resume) {
      resume = await apiCall(
        Service.FILES,
        {
          method: "GET",
          url: `files/${existingReferral.referralData.resume}`,
          params: {
            hexathon: existingReferral.hexathon.toString(),
          },
        },
        req
      );
    }
    const referralData = { ...existingReferral.referralData, resume };
    await validateReferralData(referralData);

    await ReferralModel.findByIdAndUpdate(
      req.params.id,
      {
        status: ReferralStatusType.SUBMITTED,
        referralSubmitTime: new Date(),
      },
      { new: true, runValidators: true }
    );

    await applyReferralBonus(
      existingReferral.referralData.email,
      existingReferral.hexathon,
      existingReferral._id
    );

    return res.sendStatus(204);
  })
);
