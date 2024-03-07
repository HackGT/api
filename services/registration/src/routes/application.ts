/* eslint-disable no-underscore-dangle */
import { apiCall, asyncHandler, BadRequestError, getFullName, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { FilterQuery, isValidObjectId, Types, UpdateQuery } from "mongoose";
import _ from "lodash";
import { DateTime } from "luxon";

import { getBranch, validateApplicationData } from "../common/util";
import { Application, ApplicationModel, Essay, StatusType } from "../models/application";
import { ApplicationGroupType, BranchModel, BranchType } from "../models/branch";

export const applicationRouter = express.Router();

applicationRouter.route("/").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Application> = {};
    const requireApplicationData = req.query.requireApplicationData || false;
    filter.hexathon = req.query.hexathon;
    if (req.query.status?.length) {
      filter.status = req.query.status;
    }
    if (req.query.applicationBranch?.length) {
      filter.applicationBranch = req.query.applicationBranch;
    }
    if (req.query.confirmationBranch?.length) {
      filter.confirmationBranch = req.query.confirmationBranch;
    }
    let company;
    try {
      company = await apiCall(
        Service.USERS,
        {
          method: "GET",
          url: `/companies/employees/${req.user?.uid}`,
          params: {
            hexathon: req.query.hexathon,
          },
        },
        req
      );
    } catch (err) {
      company = null;
    }

    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    // If user is not a member and has no associated company, set filter to access only their own applications
    if (!req.user?.roles.member && !company) {
      filter.userId = req.user?.uid;
    }

    if (req.query.search && typeof req.query.search === "string") {
      const searchLength = String(req.query.search).length;
      const search =
        searchLength > 75 ? String(req.query.search).slice(0, 75) : String(req.query.search);

      const sanitizedSearch = _.escapeRegExp(search);
      filter.$or = [
        { _id: isValidObjectId(search) ? new Types.ObjectId(search) : undefined },
        { userId: { $regex: new RegExp(sanitizedSearch, "i") } },
        { email: { $regex: new RegExp(sanitizedSearch, "i") } },
        { name: { $regex: new RegExp(sanitizedSearch, "i") } },
      ];
    }

    const matchCount = await ApplicationModel.accessibleBy(req.ability).find(filter).count();

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const applications = await ApplicationModel.accessibleBy(req.ability)
      .find(filter)
      .skip(offset)
      .limit(limit)
      .select(requireApplicationData ? "-finalScore" : "-applicationData -finalScore");

    return res.status(200).json({
      offset,
      total: matchCount,
      count: applications.length,
      applications,
    });
  })
);

applicationRouter.route("/generate-csv").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Application> = {};
    const requireApplicationData = req.query.requireApplicationData || false;
    filter.hexathon = req.query.hexathon;
    if (req.query.status?.length) {
      filter.status = req.query.status;
    }
    if (req.query.applicationBranch?.length) {
      filter.applicationBranch = req.query.applicationBranch;
    }
    if (req.query.confirmationBranch?.length) {
      filter.confirmationBranch = req.query.confirmationBranch;
    }

    let company;
    try {
      company = await apiCall(
        Service.USERS,
        {
          method: "GET",
          url: `/companies/employees/${req.user?.uid}`,
          params: {
            hexathon: req.query.hexathon,
          },
        },
        req
      );
    } catch (err) {
      company = null;
    }

    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    // If user is not a member and has no associated company, set filter to access only their own applications
    if (!req.user?.roles.member && !company) {
      filter.userId = req.user?.uid;
    }

    if (req.query.search && typeof req.query.search === "string") {
      const searchLength = String(req.query.search).length;
      const search =
        searchLength > 75 ? String(req.query.search).slice(0, 75) : String(req.query.search);

      const sanitizedSearch = _.escapeRegExp(search);
      filter.$or = [
        { _id: isValidObjectId(search) ? new Types.ObjectId(search) : undefined },
        { userId: { $regex: new RegExp(sanitizedSearch, "i") } },
        { email: { $regex: new RegExp(sanitizedSearch, "i") } },
        { name: { $regex: new RegExp(sanitizedSearch, "i") } },
      ];
    }

    const limit = parseInt(req.query.limit as string) || 200;
    const offset = parseInt(req.query.offset as string) || 0;
    const applications = await ApplicationModel.accessibleBy(req.ability)
      .find(filter)
      .skip(offset)
      .limit(limit)
      .select(requireApplicationData ? "-finalScore" : "-applicationData -finalScore");

    res.header("Content-Type", "text/csv");

    // Create a comma separated string with all the data
    const columns = ["name", "email", "applicationBranch", "status"];

    let combinedApplications = `${columns.join(";")}\n`;
    console.log(combinedApplications);

    applications.forEach(appl => {
      combinedApplications += `${appl.name};${appl.email};${appl.applicationBranch.name};${appl.status}`;
      combinedApplications += "\n";
    });
    res.header("Content-Type", "text/csv");
    return res.status(200).send(combinedApplications);
  })
);

applicationRouter.route("/:id").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.findById(req.params.id)
      .accessibleBy(req.ability)
      .select("-finalScore");

    if (!application) {
      throw new BadRequestError("Application not found or you do not have permission to access.");
    }

    // If this is not the current user's application and they're not a member, check for company permission
    if (application.userId !== req.user?.uid && !req.user?.roles.member) {
      let company;
      try {
        company = await apiCall(
          Service.USERS,
          {
            method: "GET",
            url: `/companies/employees/${req.user?.uid}`,
            params: {
              hexathon: application.hexathon.toString(),
            },
          },
          req
        );
      } catch (err) {
        company = null;
      }

      // If user is not a member and has no associated company, throw error
      if (!company) {
        throw new BadRequestError("Application not found or you do not have permission to access.");
      }
    }

    const applicationData = { ...application.applicationData };
    if (applicationData.resume) {
      applicationData.resume = await apiCall(
        Service.FILES,
        {
          method: "GET",
          url: `files/${applicationData.resume}`,
          params: {
            hexathon: application.hexathon.toString(),
          },
        },
        req
      );
    }

    return res.send({
      ...application.toJSON(),
      applicationData,
    });
  })
);

applicationRouter.route("/actions/choose-application-branch").post(
  checkAbility("create", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.accessibleBy(req.ability).findOne({
      userId: req.user?.uid,
      hexathon: req.body.hexathon,
    });

    const userInfo = await apiCall(
      Service.USERS,
      { method: "GET", url: `users/${req.user?.uid}` },
      req
    );
    if (!userInfo || Object.keys(userInfo).length === 0) {
      throw new BadRequestError("Please complete your user profile first.");
    }

    const branch = await BranchModel.findById(req.body.applicationBranch);
    if (!branch || branch.hexathon.toString() !== req.body.hexathon) {
      throw new BadRequestError(
        "Invalid branch. Please select an application branch that is valid for this hexathon."
      );
    }

    if (existingApplication) {
      if ([StatusType.ACCEPTED, StatusType.CONFIRMED].includes(existingApplication.status)) {
        throw new BadRequestError(
          "Cannot select an application branch. You have already submitted an application."
        );
      }

      const updatedApplication = await ApplicationModel.accessibleBy(req.ability)
        .findOneAndUpdate(
          {
            userId: req.user?.uid,
            hexathon: req.body.hexathon,
          },
          {
            status: StatusType.DRAFT,
            applicationBranch: req.body.applicationBranch,
            applicationStartTime: new Date(),
            applicationSubmitTime: undefined,
            applicationExtendedDeadline: undefined,
            applicationData: {},
            confirmationBranch: undefined,
            confirmationSubmitTime: undefined,
            confirmationExtendedDeadline: undefined,
            gradingComplete: false,
            name: getFullName(userInfo.name),
            email: userInfo.email,
          },
          {
            new: true,
          }
        )
        .select("-finalScore");

      return res.send(updatedApplication);
    }

    const newApplication = await ApplicationModel.create({
      userId: req.user?.uid,
      name: getFullName(userInfo.name),
      email: userInfo.email,
      hexathon: req.body.hexathon,
      applicationBranch: req.body.applicationBranch,
      applicationStartTime: new Date(),
    });

    return res.send(newApplication);
  })
);

applicationRouter.route("/:id/actions/save-application-data").post(
  checkAbility("update", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    const [branch] = getBranch(existingApplication, req);

    if (
      branch.type === BranchType.APPLICATION &&
      existingApplication.applicationExtendedDeadline &&
      new Date() < existingApplication.applicationExtendedDeadline
    ) {
      // Application ok to save data with extended deadline
    } else if (
      branch.type === BranchType.CONFIRMATION &&
      existingApplication.confirmationExtendedDeadline &&
      new Date() < existingApplication.confirmationExtendedDeadline
    ) {
      // Application ok to save data with extended deadline
    } else if (
      DateTime.now() < DateTime.fromJSDate(branch.settings.open) ||
      DateTime.now() > DateTime.fromJSDate(branch.settings.close).plus({ hours: 1 }) // Add 1 hour grace period
    ) {
      throw new BadRequestError("Unable to save application data. Branch is not currently open.");
    }

    if (req.body.validateData === true) {
      await validateApplicationData(req.body.applicationData, branch._id, req.body.branchFormPage);
    }

    // Need to do extra formatting for essays since they are subdocuments in Mongoose
    let { essays } = existingApplication.applicationData;
    if (req.body.applicationData.essays) {
      essays = new Types.DocumentArray<Essay>([]);
      for (const [criteria, answer] of Object.entries<any>(req.body.applicationData.essays)) {
        essays.push({
          criteria,
          answer,
        });
      }
    }

    // Need to do extra formatting for resume since its submitted as a file object
    let { resume } = existingApplication.applicationData;
    if (req.body.applicationData.resume?.id) {
      resume = req.body.applicationData.resume.id;
    } else if (_.isEmpty(req.body.applicationData.resume)) {
      resume = undefined;
    }

    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        applicationData: {
          ...existingApplication.applicationData,
          ...req.body.applicationData,
          essays,
          resume,
        },
      },
      { new: true }
    ).select("userId hexathon applicationBranch confirmationBranch applicationData");

    if (!updatedApplication) {
      throw new BadRequestError("Error saving application data.");
    }

    const applicationData = { ...updatedApplication.applicationData };
    if (applicationData.resume) {
      applicationData.resume = await apiCall(
        Service.FILES,
        { method: "GET", url: `files/${applicationData.resume}` },
        req
      );
    }

    return res.send({
      ...updatedApplication.toJSON(),
      applicationData,
    });
  })
);

applicationRouter.route("/:id/actions/submit-application").post(
  checkAbility("update", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    const [branch, branchType] = getBranch(existingApplication, req);

    if (
      branch.type === BranchType.APPLICATION &&
      existingApplication.applicationExtendedDeadline &&
      new Date() < existingApplication.applicationExtendedDeadline
    ) {
      // Application ok to save data with extended deadline
    } else if (
      branch.type === BranchType.CONFIRMATION &&
      existingApplication.confirmationExtendedDeadline &&
      new Date() < existingApplication.confirmationExtendedDeadline
    ) {
      // Application ok to save data with extended deadline
    } else if (
      DateTime.now() < DateTime.fromJSDate(branch.settings.open) ||
      DateTime.now() > DateTime.fromJSDate(branch.settings.close).plus({ hours: 1 }) // Add 1 hour grace period
    ) {
      throw new BadRequestError("Unable to submit application data. Branch is not currently open.");
    }

    // Need to do extra formatting for essays since they are subdocuments in Mongoose
    const essays: any = {};
    for (const essay of existingApplication.applicationData.essays ?? []) {
      essays[essay.criteria] = essay.answer;
    }

    // Need to do extra formatting for resumes since they are string in Mongoose
    let resume: any;
    if (existingApplication.applicationData.resume) {
      resume = await apiCall(
        Service.FILES,
        { method: "GET", url: `files/${existingApplication.applicationData.resume}` },
        req
      );
    }

    const applicationData = {
      ...existingApplication.applicationData,
      essays,
      resume,
    };

    await Promise.all(
      branch.formPages.map(async (formPage, index) => {
        await validateApplicationData(applicationData, branch._id, index);
      })
    );

    const autoConfirm = branch.automaticConfirmation;
    if (
      branchType === BranchType.APPLICATION &&
      autoConfirm?.enabled &&
      ((autoConfirm.emails ?? []).includes("*") || // matches all emails
        (autoConfirm.emails ?? []).includes(existingApplication.email) || // matches complete emails
        (autoConfirm.emails ?? []).includes(`@${existingApplication.email.split("@").pop()}`)) // matches emails by domain
    ) {
      await ApplicationModel.findByIdAndUpdate(
        req.params.id,
        {
          applicationSubmitTime: new Date(),
          confirmationSubmitTime: new Date(),
          confirmationBranch: autoConfirm?.confirmationBranch,
          status: StatusType.CONFIRMED,
        },
        { new: true }
      );
      return res.sendStatus(204);
    }

    switch (branchType) {
      case BranchType.APPLICATION:
        await ApplicationModel.findByIdAndUpdate(
          req.params.id,
          {
            applicationSubmitTime: new Date(),
            status: StatusType.APPLIED,
          },
          { new: true }
        );
        break;
      case BranchType.CONFIRMATION:
        await ApplicationModel.findByIdAndUpdate(
          req.params.id,
          {
            confirmationSubmitTime: new Date(),
            status: StatusType.CONFIRMED,
          },
          { new: true }
        );
        break;
      // no default
    }

    // Send confirmation email after submission
    if (branch.postSubmitEmailTemplate.enabled) {
      await apiCall(
        Service.NOTIFICATIONS,
        {
          method: "POST",
          url: "/email/send-registration-confirmation",
          data: {
            message: branch.postSubmitEmailTemplate.content,
            subject: branch.postSubmitEmailTemplate.subject,
            hexathon: existingApplication.hexathon,
          },
        },
        req
      );
    }

    return res.sendStatus(204);
  })
);

applicationRouter.route("/:id/actions/update-status").post(
  checkAbility("update", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    const newStatus = StatusType[req.body.status as keyof typeof StatusType];
    const updateBody: UpdateQuery<Application> = {
      status: newStatus,
    };

    // Non-member users are restricted to changing status in only very limited circumstances
    if (!req.user?.roles.member) {
      if (
        existingApplication.status === StatusType.ACCEPTED &&
        newStatus === StatusType.CONFIRMED &&
        (existingApplication.confirmationBranch === undefined ||
          existingApplication.confirmationBranch.formPages.length === 0)
      ) {
        updateBody.confirmationSubmitTime = new Date();
      } else if (
        existingApplication.status === StatusType.ACCEPTED &&
        newStatus === StatusType.NOT_ATTENDING
      ) {
        // pass
      } else {
        throw new BadRequestError(
          "You do not have permission to change this application to the new status provided."
        );
      }
    }

    await ApplicationModel.findByIdAndUpdate(req.params.id, updateBody, { new: true });

    if (
      existingApplication.applicationBranch.applicationGroup === ApplicationGroupType.PARTICIPANT &&
      newStatus === StatusType.CONFIRMED
    ) {
      await apiCall(
        Service.HEXATHONS,
        {
          method: "POST",
          url: `/hexathon-users/${existingApplication.hexathon}/users/${existingApplication.userId}/actions/check-valid-user`,
        },
        req
      );
    }

    return res.sendStatus(204);
  })
);

applicationRouter.route("/:id/actions/update-application").post(
  checkAbility("update", "Application"),
  asyncHandler(async (req, res) => {
    if (!req.user?.roles.member) {
      throw new BadRequestError(
        "You do not have permission to change this application to the new status provided."
      );
    }

    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    const {
      applicationBranch,
      confirmationBranch,
      status,
      applicationExtendedDeadline,
      confirmationExtendedDeadline,
    } = req.body;

    if (!applicationBranch) {
      throw new BadRequestError("Applicant must have an application branch.");
    }

    let newConfirmationBranch = confirmationBranch;
    let newConfirmationExtendedDeadline = confirmationExtendedDeadline;
    const newStatus = StatusType[status as keyof typeof StatusType];

    if ([StatusType.CONFIRMED, StatusType.ACCEPTED].includes(newStatus)) {
      if (!confirmationBranch) {
        throw new BadRequestError(
          `Applicant must have a confirmation branch with status ${newStatus}.`
        );
      }
    } else if (newStatus === StatusType.NOT_ATTENDING) {
      // Keep confirmation branch the same if provided
      newConfirmationExtendedDeadline = null;
    } else {
      newConfirmationBranch = null;
      newConfirmationExtendedDeadline = null;
    }

    await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        applicationBranch,
        confirmationBranch: newConfirmationBranch,
        status: newStatus,
        applicationExtendedDeadline,
        confirmationExtendedDeadline: newConfirmationExtendedDeadline,
      },
      { new: true }
    );

    if (
      existingApplication.applicationBranch.applicationGroup === ApplicationGroupType.PARTICIPANT &&
      newStatus === StatusType.CONFIRMED
    ) {
      await apiCall(
        Service.HEXATHONS,
        {
          method: "POST",
          url: `/hexathon-users/${existingApplication.hexathon}/users/${existingApplication.userId}/actions/check-valid-user`,
        },
        req
      );
    }

    return res.sendStatus(204);
  })
);

applicationRouter.route("/:id/actions/reset-application").post(
  checkAbility("manage", "Application"),
  asyncHandler(async (req, res) => {
    const existingApplication = await ApplicationModel.findById(req.params.id).accessibleBy(
      req.ability
    );

    if (!existingApplication) {
      throw new BadRequestError(
        "No application exists with this id or you do not have permission."
      );
    }

    await ApplicationModel.findByIdAndUpdate(
      req.params.id,
      {
        applicationSubmitTime: undefined,
        confirmationSubmitTime: undefined,
        status: StatusType.DRAFT,
      },
      { new: true }
    );

    return res.sendStatus(204);
  })
);

applicationRouter.route("/compile-extra-info").get(
  checkAbility("aggregate", "Application"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Application> = {};
    filter.hexathon = req.query.hexathon;

    const compiledExtraInfo: string[] = [];

    const applications = await ApplicationModel.accessibleBy(req.ability)
      .find(filter)
      .select("applicationData");

    for (const application of applications) {
      if (
        application.applicationData.extraInfo &&
        application.applicationData.extraInfo.length > 0
      ) {
        compiledExtraInfo.push(application.applicationData.extraInfo);
      }
    }

    return res.status(200).json(compiledExtraInfo);
  })
);

applicationRouter.route("/actions/expo-user").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    const application = await ApplicationModel.findOne({
      hexathon: req.query.hexathon,
      email: req.query.email,
    }).select("id userId name email applicationBranch confirmationBranch status");

    if (!application) {
      throw new BadRequestError("No valid application found");
    }

    return res.status(200).json(application);
  })
);

applicationRouter.route("/slack/confirmed-users").get(
  checkAbility("read", "Application"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Application> = {};
    filter.hexathon = req.query.hexathon;
    filter.status = StatusType.CONFIRMED;

    if (req.body.confirmationBranches?.length) {
      filter.confirmationBranch = { $in: req.body.confirmationBranches };
    }

    const applications = await ApplicationModel.accessibleBy(req.ability)
      .find(filter)
      .select("-applicationData");

    const confirmedEmails = [];
    for (const application of applications) {
      confirmedEmails.push(application.email);
    }

    return res.status(200).json({
      confirmationBranches: req.body.confirmationBranches || "All",
      confirmedEmails,
    });
  })
);
