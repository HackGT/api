/* eslint-disable object-shorthand */
import sendgrid from "@sendgrid/mail";
import { marked } from "marked";
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

// We use this function instead of making one call. See below link.
// https://stackoverflow.com/questions/69620048/sendgrid-nodejs-handling-errors-when-sending-bulk-emails
const sendOneMessage = async (
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
    // Sendgrid errors are here
    if (error.response?.body?.errors) {
      console.log(error.response.body.errors);
    }

    return {
      error: true,
      key: email,
      payload: error.message,
    };
  }
};

const renderMarkdown = (markdownString: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    marked(markdownString, { smartypants: true }, (err: Error | null, parseResult: string) => {
      if (err) {
        console.log("Error in markdown");
        reject(err);
      } else {
        resolve(parseResult);
      }
    });
  });

export const sendMessages = async (
  message: string,
  emails: string[],
  subject: string,
  headerImage: string
): Promise<Status[]> => {
  try {
    const renderedMarkdown = await renderMarkdown(message);
    const renderedHtml = await emailRender.render("html", {
      emailHeaderImage: headerImage,
      website: config.common.socialMedia.website,
      instagramHandle: config.common.socialMedia.instagramHandle,
      twitterHandle: config.common.socialMedia.twitterHandle,
      facebookHandle: config.common.socialMedia.facebookHandle,
      emailAddress: config.common.emailAddress,
      body: renderedMarkdown,
    });
    const renderedText = htmlToText(renderedMarkdown);

    return await Promise.all(
      emails.map(email => sendOneMessage(email, subject, renderedHtml, renderedText))
    );
  } catch (error: any) {
    return [
      {
        error: true,
        key: subject,
        payload: error.message,
      },
    ];
  }
};
