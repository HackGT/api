import { WebClient } from "@slack/web-api";
import { GraphQLError } from "graphql";

import { RequisitionStatus } from "@api/prisma/generated";
import {
  projectReferenceString,
  requisitionReferenceString,
  statusToString,
} from "../api/resolvers/common";
import { prisma } from "../common";

const web = new WebClient(process.env.SLACK_API_TOKEN);

export const sendSlackNotification = async (requisitionId: number) => {
  const requisition = await prisma.requisition.findUnique({
    where: {
      id: requisitionId,
    },
    include: {
      project: true,
      createdBy: true,
      approvals: {
        orderBy: {
          id: "desc",
        },
      },
    },
  });

  if (!requisition) {
    throw new GraphQLError("Requisition not found when sending slack message.");
  }

  if (!process.env.SLACK_API_TOKEN || !process.env.ROOT_URL) {
    console.log("No slack api token or root url provided. Not sending slack message.");
    return;
  }

  const url = `${process.env.ROOT_URL}/project/${projectReferenceString(
    requisition.project
  )}/requisition/${requisition.projectRequisitionId}`;
  const nameSnippet = `<${url}|${requisitionReferenceString(requisition)}> (${
    requisition.headline
  })`;
  const userSnippet = requisition.createdBy.slackId
    ? `<@${requisition.createdBy.slackId}>`
    : requisition.createdBy.name;

  try {
    // If the user has their Slack account linked and requisition is not a draft, send a notification
    if (requisition.createdBy.slackId && requisition.status !== RequisitionStatus.DRAFT) {
      let message;
      if (requisition.status === RequisitionStatus.SUBMITTED) {
        message = `Thank you for submitting requisition ${nameSnippet}! You will receive alerts from me when the status is changed.`;
      } else if (requisition.status === RequisitionStatus.PENDING_CHANGES) {
        message = `Requisition ${nameSnippet} has requested changes. Notes by reviewer: ${requisition.approvals[0].notes}`;
      } else {
        message = `Requisition ${nameSnippet} status updated to *${statusToString(
          requisition.status
        )}*`;
      }

      await web.chat.postMessage({
        channel: requisition.createdBy.slackId,
        text: message,
      });
    }

    // Send alert to alert channel whenever a new requisition is made
    if (process.env.ADMIN_ALERT_CHANNEL && requisition.status === RequisitionStatus.SUBMITTED) {
      await web.chat.postMessage({
        channel: `#${process.env.ADMIN_ALERT_CHANNEL}`,
        text: `A new requisition, ${nameSnippet}, was submitted by ${userSnippet}.`,
      });
    }
  } catch (error) {
    console.error(error);
  }
};
