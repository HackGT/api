/* eslint-disable object-shorthand */
import sendgrid from "@sendgrid/mail";
import path from "path";
import { htmlToText } from "html-to-text";
import config from "@api/config";

import { Status } from "./types";

// eslint-disable-next-line camelcase, @typescript-eslint/no-var-requires
const Email = require("email-templates");

// The email template is created using email templates from MailerLite and MailChimp.
// Some of the custom fields were manually populated in
const emailRender = new Email({
  views: {
    root: path.join(__dirname, "..", "email-template"),
  },
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: path.join(__dirname, "..", "email-template"),
    },
  },
});

const sendgridApiKey = config.services.NOTIFICATIONS.pluginConfig?.email.sendgridApiKey || "SG.";
sendgrid.setApiKey(sendgridApiKey);

/**
 * Renders an HTML message for an email in both HTML and text formats.
 * @param message the message body to render
 * @param headerImage the image URL to use for the header
 */
export const renderEmail = async (message: string, headerImage: string) => {
  const renderedHtml = await emailRender.render("html", {
    emailHeaderImage: headerImage,
    website: config.common.socialMedia.website,
    instagramHandle: config.common.socialMedia.instagramHandle,
    twitterHandle: config.common.socialMedia.twitterHandle,
    facebookHandle: config.common.socialMedia.facebookHandle,
    emailAddress: config.common.emailAddress,
    body: message,
  });
  const renderedText = htmlToText(renderedHtml);

  return [renderedHtml, renderedText];
};

/**
 * Slightly sanitizes text for email use.
 */
const sanitize = (text?: string) => {
  if (!text || typeof text !== "string") {
    return "";
  }
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

/**
 * Sends one message to an email address. We use this function instead
 * of making one call.
 * https://stackoverflow.com/questions/69620048/sendgrid-nodejs-handling-errors-when-sending-bulk-emails
 */
export const sendOneMessage = async (
  email: string,
  subject: string,
  renderedHtml: string,
  renderedText: string
): Promise<Status> => {
  try {
    await sendgrid.send({
      from: config.common.emailAddress,
      to: email,
      html: renderedHtml,
      text: renderedText,
      subject: subject,
    });

    return {
      error: false,
      key: email,
      payload: "Email sent successfully",
    };
  } catch (error: any) {
    // If a Sendgrid error occurs, return that error message
    if (error.response?.body?.errors && error.response?.body?.errors.length > 0) {
      return {
        error: true,
        key: email,
        payload: error.response.body.errors[0].message,
      };
    }

    return {
      error: true,
      key: email,
      payload: error.message,
    };
  }
};

/**
 * Sends an email to a user and personalizes the message. It replaces placeholders
 * with the user's name and other personal info.
 */
export const sendOnePersonalizedMessages = async (
  message: string,
  user: any,
  subject: string,
  headerImage: string
): Promise<Status> => {
  try {
    let updatedMessage = message;
    updatedMessage = updatedMessage.replace(/{{first_name}}/g, sanitize(user?.name?.first));
    updatedMessage = updatedMessage.replace(/{{middle_name}}/g, sanitize(user?.name?.middle));
    updatedMessage = updatedMessage.replace(/{{last_name}}/g, sanitize(user?.name?.last));
    updatedMessage = updatedMessage.replace(/{{email}}/g, sanitize(user?.email));

    const [renderedHtml, renderedText] = await renderEmail(updatedMessage, headerImage);

    return sendOneMessage(user?.email, subject, renderedHtml, renderedText);
  } catch (error: any) {
    return {
      error: true,
      key: subject,
      payload: error.message,
    };
  }
};
