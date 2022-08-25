import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { PromisePool } from "@supercharge/promise-pool";
import { CloudTasksClient, protos } from "@google-cloud/tasks";
import config, { Service } from "@api/config";
import _ from "lodash";
import { FilterQuery } from "mongoose";

import { EmailModel } from "../models/email";
import { Application, ApplicationModel } from "../models/application";

export const emailRouter = express.Router();

const client = new CloudTasksClient();

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

    if (req.body.branchList && req.body.branchList.length > 0) {
      filter.applicationBranch = { $in: req.body.branchList };
      filter.confirmationBranch = { $in: req.body.branchList };
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

    // Split userIds into batches of 20
    const chunkedUserIds = _.chunk(userIds, 20);

    // Create the task queue for sending these emails
    const parent = client.queuePath(
      config.common.googleCloud.project,
      config.common.googleCloud.location,
      config.common.googleCloud.taskQueue
    );

    await PromisePool.for(chunkedUserIds)
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

        console.log(task);

        return client.createTask({ parent, task });
      });

    return res.send(email);
  })
);
