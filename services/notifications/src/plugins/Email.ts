/* eslint-disable object-shorthand */
import sendgrid from "@sendgrid/mail";
import { marked } from "marked";
import path from "path";
import { htmlToText } from "html-to-text";
import config from "@api/config";

import { Status, EmailConfig } from "./types";

// eslint-disable-next-line camelcase, @typescript-eslint/no-var-requires
const Email = require("email-templates");

const email = new Email({
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
const from = config.services.NOTIFICATIONS.pluginConfig?.email.from || "";
const headerImage = config.services.NOTIFICATIONS.pluginConfig?.email.headerImage || "";
const twitterHandle = config.common.socialMedia.twitterHandle || "";
const facebookHandle = config.common.socialMedia.facebookHandle || "";

sendgrid.setApiKey(sendgridApiKey);

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

export const sendMessage = async (message: string, config: EmailConfig): Promise<Status[]> => {
  const renderedMarkdown = await renderMarkdown(message);
  const renderedHtml = await email.render("html", {
    emailHeaderImage: config.headerImage || headerImage,
    twitterHandle: twitterHandle,
    facebookHandle: facebookHandle,
    body: renderedMarkdown,
  });
  const renderedText = htmlToText(renderedMarkdown);

  try {
    await sendgrid.sendMultiple({
      from: from,
      to: config.emails,
      html: renderedHtml,
      text: renderedText,
      subject: config.subject,
    });

    return config.emails.map(toEmail => ({
      error: false,
      key: toEmail,
      payload: "Email sent successfully",
    }));
  } catch (error) {
    let errorMessage = "Failure";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return [
      {
        error: true,
        key: config.subject,
        payload: errorMessage,
      },
    ];
  }
};
