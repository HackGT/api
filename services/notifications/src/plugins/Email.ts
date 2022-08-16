/* eslint-disable object-shorthand */
import sendgrid from "@sendgrid/mail";
import { marked } from "marked";
import path from "path";
import { htmlToText } from "html-to-text";
import config from "@api/config";

import { Status } from "./types";

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

export const sendMessages = async (
  message: string,
  subject: string,
  emails: string[],
  headerImage: string
): Promise<Status[]> => {
  const renderedMarkdown = await renderMarkdown(message);
  const renderedHtml = await email.render("html", {
    emailHeaderImage: headerImage,
    twitterHandle: config.common.socialMedia.twitterHandle,
    facebookHandle: config.common.socialMedia.facebookHandle,
    body: renderedMarkdown,
  });
  const renderedText = htmlToText(renderedMarkdown);

  try {
    await sendgrid.sendMultiple({
      from: config.services.NOTIFICATIONS.pluginConfig?.email.from || "",
      to: emails,
      html: renderedHtml,
      text: renderedText,
      subject: subject,
    });

    return emails.map(toEmail => ({
      error: false,
      key: toEmail,
      payload: "Email sent successfully",
    }));
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
