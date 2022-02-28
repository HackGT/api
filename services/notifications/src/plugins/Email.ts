import sendgrid from "@sendgrid/mail";
import { marked } from "marked";
import path from "path";
import { htmlToText } from "html-to-text";

import { PluginSetup, Plugin, Status } from "./types";

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

export interface EmailConfig {
  subject: string;
  emails: string[];
  headerImage?: string;
}

export class EmailPlugin implements Plugin<EmailConfig> {
  private from: string;
  private headerImage: string;
  private twitterHandle: string;
  private facebookHandle: string;
  private contactAddress: string;

  constructor() {
    const sendgridApiKey = String(process.env.SENDGRID_API_KEY) || "";
    this.from = String(process.env.EMAIL_FROM) || "";
    this.headerImage = String(process.env.EMAIL_HEADER_IMAGE) || "";
    this.twitterHandle = String(process.env.EMAIL_TWITTER_HANDLE) || "";
    this.facebookHandle = String(process.env.EMAIL_FACEBOOK_HANDLE) || "";
    this.contactAddress = String(process.env.EMAIL_CONTACT_ADDRESS) || "";

    if (process.env.DEV_MODE !== "true") {
      if (
        !sendgridApiKey ||
        !this.from ||
        !this.headerImage ||
        !this.twitterHandle ||
        !this.facebookHandle ||
        !this.contactAddress
      ) {
        throw new Error("Missing email env vars. exiting.");
      }
    }

    sendgrid.setApiKey(sendgridApiKey);
  }

  private static async renderMarkdown(markdownString: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      marked(markdownString, { smartypants: true }, (err: Error | null, parseResult: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(parseResult);
        }
      });
    });
  }

  public async sendMessage(message: string, config: EmailConfig): Promise<Status[]> {
    const renderedMarkdown = await EmailPlugin.renderMarkdown(message);
    const renderedHtml = await email.render("html", {
      emailHeaderImage: config.headerImage || this.headerImage,
      twitterHandle: this.twitterHandle,
      facebookHandle: this.facebookHandle,
      emailAddress: this.contactAddress,
      body: renderedMarkdown,
    });
    const renderedText = htmlToText(renderedMarkdown);

    try {
      await sendgrid.sendMultiple({
        from: this.from,
        to: config.emails,
        html: renderedHtml,
        text: renderedText,
        subject: config.subject,
      });

      return config.emails.map(toEmail => ({
        error: false,
        key: toEmail,
        message: "Email sent successfully",
      }));
    } catch (error) {
      let errorMessage = 'Failure'
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.log(errorMessage);
      return [
        {
          error: true,
          key: config.subject,
          message: errorMessage,
        },
      ];
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  public async check(configTest: any): Promise<boolean> {
    return true;
  }
}

export const EmailSetup: PluginSetup<EmailConfig> = {
  schema: () => `{
		subject: String!
    emails: [String!]!
    headerImage: String
	}`,
  init: () => new EmailPlugin(),
};