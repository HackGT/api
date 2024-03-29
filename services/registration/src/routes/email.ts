import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { PromisePool } from "@supercharge/promise-pool";
import { CloudTasksClient, protos } from "@google-cloud/tasks";
import config, { Service } from "@api/config";
import _ from "lodash";
import { FilterQuery } from "mongoose";

import { Email, EmailModel } from "../models/email";
import { Application, ApplicationModel } from "../models/application";

export const emailRouter = express.Router();

const client = new CloudTasksClient();

emailRouter.route("/").get(
  checkAbility("read", "Email"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const filter: FilterQuery<Email> = {
      hexathon: req.query.hexathon,
    };

    const emails = await EmailModel.accessibleBy(req.ability)
      .find(filter)
      .sort({ timestamp: -1 })
      .populate("filter.branchList");

    const users: any[] = await apiCall(
      Service.USERS,
      {
        url: "/users/actions/retrieve",
        method: "POST",
        data: {
          userIds: emails.map(email => email.sender),
        },
      },
      req
    );

    const emailsWithUserNames = emails.map(email => ({
      ...email.toJSON(),
      sender: users.find((user: any) => user.userId === email.sender),
    }));

    return res.send(emailsWithUserNames);
  })
);

emailRouter.route("/actions/send-emails").post(
  checkAbility("create", "Email"),
  asyncHandler(async (req, res) => {
    const { message, subject } = req.body;

    if (!message || !subject) {
      throw new BadRequestError("Email message and subject are required.");
    }

    const filter: FilterQuery<Application> = {
      hexathon: req.body.hexathon,
    };

    // Match applications where either application or confirmation branch is in the list
    if (req.body.branchList && req.body.branchList.length > 0) {
      filter.$or = [
        {
          applicationBranch: {
            $in: req.body.branchList,
          },
        },
        {
          confirmationBranch: {
            $in: req.body.branchList,
          },
        },
      ];
    }
    if (req.body.statusList && req.body.statusList.length > 0) {
      filter.status = { $in: req.body.statusList };
    }

    const applications = await ApplicationModel.accessibleBy(req.ability).find(filter);

    const userIds = applications.map(application => application.userId);

    const email = await EmailModel.create({
      hexathon: req.body.hexathon,
      filter: {
        branchList: req.body.branchList,
        statusList: req.body.statusList,
      },
      sender: req.user?.uid,
      recipients: userIds,
      message,
      subject,
      timestamp: new Date(),
    });

    // Manually send an email to the sender to ensure the email looks ok
    await apiCall(
      Service.NOTIFICATIONS,
      {
        method: "POST",
        url: "/email/send-personalized",
        data: {
          message,
          subject: `[SENDER FYI] ${subject}`,
          userIds: [req.user?.uid],
          hexathon: req.body.hexathon,
        },
      },
      req
    );

    // Split userIds into batches of 20
    const chunkedUserIds = _.chunk(userIds, 20);

    // Create the task queue for sending these emails
    const parent = client.queuePath(
      config.common.googleCloud.project,
      config.common.googleCloud.location,
      config.common.googleCloud.taskQueue
    );

    const { errors } = await PromisePool.for(chunkedUserIds)
      .withConcurrency(20)
      .process(async chunkedUserId => {
        const task: protos.google.cloud.tasks.v2.ITask = {
          httpRequest: {
            httpMethod: "POST",
            body: Buffer.from(
              JSON.stringify({
                message,
                subject,
                userIds: chunkedUserId,
                hexathon: req.body.hexathon,
                batchId: email.id,
              })
            ).toString("base64"),
            headers: {
              "Content-type": "application/json",
            },
            url: `${config.services[Service.NOTIFICATIONS].proxy.target}/email/send-personalized`,
            oidcToken: {
              serviceAccountEmail: config.common.googleCloud.serviceAccount,
            },
          },
        };

        return client.createTask({ parent, task });
      });

    if (errors.length > 0) {
      console.log(errors);
    }

    return res.send(email);
  })
);
