import { http } from "@google-cloud/functions-framework";
import { apiCall } from "@api/common";
import { Service } from "@api/config";

http("beforeCreate", async (req, res) => {
  // send welcome email
  // call method in notification service that calls MailerLite

  await apiCall(
    Service.NOTIFICATIONS,
    {
      url: `/email/new-subscriber/${req.body.email}`,
      method: "POST",
    },
    req
  );
});
