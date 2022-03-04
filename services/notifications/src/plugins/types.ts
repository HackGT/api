export type Status = {
  error: boolean;
  key: string;
  payload?: string;
};

export type TwilioConfig = {
  numbers: string[];
};

export type EmailConfig = {
  subject: string;
  emails: string[];
  headerImage?: string;
};
