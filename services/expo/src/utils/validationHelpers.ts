import rp from "request-promise";
import cheerio from "cheerio";
import { URL } from "url";
import { apiCall, User } from "@api/common";
import admin from "firebase-admin";
import express from "express";
import { Service } from "@api/config";

import { prisma } from "../common";
import { prizeConfig } from "../config/prizeConfig";
import { getConfig, getCurrentHexathon } from "./utils";

/*
    - Classify team into prize based on user tracks (from registration)
    - Return eligible prizes based on team type
*/
export const getEligiblePrizes = async (users: any[], req: express.Request) => {
  const currentHexathon = await getCurrentHexathon(req);
  switch (currentHexathon.name) {
    case "HackGT 7": {
      let numEmerging = 0;

      for (const user of users) {
        if (!user || !user.applicationBranch) {
          return {
            error: true,
            message: `User: ${user.email} does not have a confirmation branch`,
          };
        }

        if (user.applicationBranch.name === "Emerging Participant Confirmation") {
          numEmerging += 1;
        }
      }

      // A team must be greater than 50% emerging to be eligible for emerging prizes
      if (numEmerging / users.length > 0.5) {
        return prizeConfig.hexathons["HackGT 7"].emergingPrizes.concat(
          prizeConfig.hexathons["HackGT 7"].sponsorPrizes
        );
      }

      return prizeConfig.hexathons["HackGT 7"].sponsorPrizes;
    }
    case "HackGT 8": {
      let numEmerging = 0;

      for (const user of users) {
        if (!user || !user.applicationBranch) {
          return {
            error: true,
            message: `User: ${user.email} does not have a confirmation branch`,
          };
        }

        if (
          user.applicationBranch.name === "Emerging In-Person Participant Confirmation" ||
          user.applicationBranch.name === "Emerging Virtual Participant Confirmation"
        ) {
          numEmerging += 1;
        }
      }

      // A team must be greater than 50% emerging to be eligible for emerging prizes
      if (numEmerging / users.length > 0.5) {
        const emergingPrizes = prizeConfig.hexathons["HackGT 8"].emergingPrizes
          .concat(prizeConfig.hexathons["HackGT 8"].sponsorPrizes)
          .concat(prizeConfig.hexathons["HackGT 8"].generalPrizes)
          .concat(prizeConfig.hexathons["HackGT 8"].openSourcePrizes);
        const emergingDBPrizes = await prisma.category.findMany({
          where: {
            name: {
              in: emergingPrizes,
            },
          },
        });
        return emergingDBPrizes;
      }
      const generalPrizes = prizeConfig.hexathons["HackGT 8"].sponsorPrizes
        .concat(prizeConfig.hexathons["HackGT 8"].generalPrizes)
        .concat(prizeConfig.hexathons["HackGT 8"].openSourcePrizes);
      const generalDBPrizes = await prisma.category.findMany({
        where: {
          name: {
            in: generalPrizes,
          },
        },
      });
      return generalDBPrizes;
    }
    case "Horizons 2022": {
      const { tracks, challenges } = prizeConfig.hexathons["Horizons 2022"];

      const generalDBPrizes = await prisma.category.findMany({
        where: {
          name: {
            in: tracks.concat(challenges),
          },
        },
      });
      return generalDBPrizes;
    }
    case "Prototypical 2022": {
      const { tracks } = prizeConfig.hexathons["Prototypical 2022"];

      const generalDBPrizes = await prisma.category.findMany({
        where: {
          name: {
            in: tracks,
          },
        },
      });

      return generalDBPrizes;
    }
    case "HackGT 9": {
      let numEmerging = 0;

      for (const user of users) {
        if (!user || !user.applicationBranch) {
          return {
            error: true,
            message: `User: ${user.email} does not have a confirmation branch`,
          };
        }

        if (user.applicationBranch.name.includes("Emerging")) {
          numEmerging += 1;
        }
      }

      // A team must be 100% emerging to be eligible for emerging prizes
      if (numEmerging === users.length) {
        const emergingPrizes = prizeConfig.hexathons["HackGT 9"].emergingPrizes
          .concat(prizeConfig.hexathons["HackGT 9"].sponsorPrizes)
          .concat(prizeConfig.hexathons["HackGT 9"].generalPrizes);
        const emergingDBPrizes = await prisma.category.findMany({
          where: {
            name: {
              in: emergingPrizes,
            },
          },
        });
        return emergingDBPrizes;
      }

      const generalPrizes = prizeConfig.hexathons["HackGT 9"].sponsorPrizes.concat(
        prizeConfig.hexathons["HackGT 9"].generalPrizes
      );
      const generalDBPrizes = await prisma.category.findMany({
        where: {
          name: {
            in: generalPrizes,
          },
        },
      });
      return generalDBPrizes;
    }
    case "Horizons 2023": {
      const { tracks, challenges } = prizeConfig.hexathons["Horizons 2023"];

      const generalDBPrizes = await prisma.category.findMany({
        where: {
          name: {
            in: tracks.concat(challenges),
          },
        },
      });
      return generalDBPrizes;
    }
    case "HackGT X": {
      const { generalPrizes, emergingPrizes, sponsorPrizes } = prizeConfig.hexathons["HackGT X"];
      const allPrizes = generalPrizes.concat(emergingPrizes).concat(sponsorPrizes);

      const dbPrizes = await prisma.category.findMany({
        where: {
          name: {
            in: allPrizes,
          },
        },
      });
      return dbPrizes;
    }
    case "Horizons 2024": {
      const { tracks, challenges } = prizeConfig.hexathons["Horizons 2024"];

      const generalDBPrizes = await prisma.category.findMany({
        where: {
          name: {
            in: tracks.concat(challenges),
          },
        },
      });
      return generalDBPrizes;
    }

    default: {
      return [];
    }
  }
};

/*
    - Query emails from check-in and ensure users accepted to event
    - Create new user objects for users not in db (with email field and name from check-in)
*/
export const validateTeam = async (members: any[], req: express.Request) => {
  if (!members || members.length === 0) {
    return { error: true, message: "Must include at least one member" };
  }
  if (members.length > 4) {
    return { error: true, message: "Too many members on team" };
  }

  const memberEmails: string[] = members.map(member => member.email);

  if (!req.user || memberEmails[0] !== req.user.email) {
    return { error: true, message: "Email does not match current user" };
  }

  let registrationError: { error: boolean; message: string } | null = null;
  const currentHexathon = await getCurrentHexathon(req);

  const registrationUsers: any[] = await Promise.all(
    memberEmails.map(async email => {
      // TODO: Need to secure this route
      let userApplication: any;
      try {
        userApplication = await apiCall(
          Service.REGISTRATION,
          {
            url: `/applications/actions/expo-user`,
            method: "GET",
            params: {
              hexathon: currentHexathon.id,
              email,
            },
          },
          req
        );
      } catch (error) {
        console.error(`validation error: ${error}`);
        registrationError = {
          error: true,
          message: `We couldn't find the emails you entered in our registration system. Please make sure you entered the emails you used to register for this event.`,
        };
        return "";
      }

      // Checks the user's applications and if they are confirmed for the current hexathon
      if (userApplication.status !== "CONFIRMED") {
        registrationError = {
          error: true,
          message: `User: ${email} not confirmed for current ${currentHexathon.name}`,
        };
        return "";
      }

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        try {
          const newUser = await admin.auth().getUserByEmail(email);

          await prisma.user.create({
            data: {
              name: userApplication.name,
              email,
              userId: newUser.uid,
            },
          });
        } catch (error) {
          return registrationError;
        }
      } else {
        const existingProject = await prisma.project.findFirst({
          where: {
            members: {
              some: {
                id: user.id,
              },
            },
            hexathon: currentHexathon.id,
          },
        });

        if (existingProject != null) {
          registrationError = {
            error: true,
            message: `User: ${user.email} already has a submission for current ${currentHexathon.name}`,
          };
          return "";
        }
      }

      return userApplication;
    })
  );

  if (registrationError != null) {
    return registrationError;
  }

  const eligiblePrizes = await getEligiblePrizes(registrationUsers, req);
  return { error: false, eligiblePrizes, registrationUsers };
};

/*
  - Validate prizes to ensure the correct selection is made
*/
export const validatePrizes = async (prizes: any[], req: express.Request) => {
  const currentHexathon = await getCurrentHexathon(req);
  const prizeObjects = await prisma.category.findMany({
    where: {
      id: {
        in: prizes,
      },
    },
  });
  const prizeNames = prizeObjects.map(prize => prize.name);

  switch (currentHexathon.name) {
    case "HackGT 8": {
      if (prizeNames.includes("HackGT - Best Open Source Hack") && prizeObjects.length > 1) {
        return {
          error: true,
          message: "If you are submitting to open source you can only submit to that prize",
        };
      }

      return { error: false };
    }
    case "Horizons 2022": {
      if (
        prizeNames.filter(prize => prizeConfig.hexathons["Horizons 2022"].tracks.includes(prize))
          .length > 1
      ) {
        return {
          error: true,
          message: "You are only eligible to submit for one track.",
        };
      }

      if (
        prizeNames.filter(prize => prizeConfig.hexathons["Horizons 2022"].tracks.includes(prize))
          .length === 0
      ) {
        return {
          error: true,
          message: "You must submit to at least one track.",
        };
      }

      return { error: false };
    }
    case "HackGT 9": {
      if (
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT 9"].generalPrizes.includes(prize))
          .length > 1
      ) {
        return {
          error: true,
          message: "You are only eligible to submit for one track.",
        };
      }

      if (
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT 9"].generalPrizes.includes(prize))
          .length === 0 &&
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT 9"].emergingPrizes.includes(prize))
          .length === 0
      ) {
        return {
          error: true,
          message: "You must submit to at least one track.",
        };
      }
      return { error: false };
    }
    case "Horizons 2023": {
      if (
        prizeNames.filter(prize => prizeConfig.hexathons["Horizons 2023"].tracks.includes(prize))
          .length === 0
      ) {
        return {
          error: true,
          message: "You must submit to at least one track.",
        };
      }

      if (
        prizeNames.filter(prize => prizeConfig.hexathons["Horizons 2023"].tracks.includes(prize))
          .length > 1
      ) {
        return {
          error: true,
          message: "You can only submit to at most one track.",
        };
      }

      return { error: false };
    }

    case "HackGT X": {
      if (
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT X"].generalPrizes.includes(prize))
          .length > 1 ||
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT X"].emergingPrizes.includes(prize))
          .length > 1
      ) {
        return {
          error: true,
          message: "You are only eligible to submit for one track.",
        };
      }

      // if prizenames has a general and emerging prize, return error
      if (
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT X"].generalPrizes.includes(prize))
          .length > 0 &&
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT X"].emergingPrizes.includes(prize))
          .length > 0
      ) {
        return {
          error: true,
          message: "You are only eligible to submit for either an emerging or general track.",
        };
      }

      if (
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT X"].generalPrizes.includes(prize))
          .length === 0 &&
        prizeNames.filter(prize => prizeConfig.hexathons["HackGT X"].emergingPrizes.includes(prize))
          .length === 0
      ) {
        return {
          error: true,
          message: "You must submit to at least one track.",
        };
      }
      return { error: false };
    }

    case "Horizons 2024": {
      if (
        prizeNames.filter(prize => prizeConfig.hexathons["Horizons 2024"].tracks.includes(prize))
          .length === 0
      ) {
        return {
          error: true,
          message: "You must submit to at least one track.",
        };
      }

      if (
        prizeNames.filter(prize => prizeConfig.hexathons["Horizons 2024"].tracks.includes(prize))
          .length > 1
      ) {
        return {
          error: true,
          message: "You can only submit to at most one track.",
        };
      }
      return { error: false };
    }

    default: {
      return { error: false };
    }
  }
};

/*
    - Ensure url is the right devpost url
    - Ensure project isn't submitted to multiple hexathons
*/
export const validateDevpost = async (devpostUrl: string, submissionName: string) => {
  const config = await getConfig();

  if (!config.isDevpostCheckingOn) {
    return { error: false };
  }

  if (!devpostUrl) {
    return { error: true, message: "No url specified" };
  }

  const { hostname } = new URL(devpostUrl);
  if (hostname !== "devpost.com") {
    return { error: true, message: "Invalid URL: Not a devpost domain" };
  }

  let html = "";
  try {
    html = await rp(devpostUrl);
  } catch (err) {
    return { error: true, message: "Invalid Project URL" };
  }

  const $ = cheerio.load(html);
  const devpostUrls = [];
  let submitted = false;
  $("#submissions")
    .find("ul")
    .children("li")
    .each((_index, elem) => {
      const item = $(elem).find("div a").attr("href");
      if (item) {
        devpostUrls.push(item);
        if (item.includes(String(process.env.HACKGT_DEVPOST))) {
          submitted = true;
        }
      }
    });

  const devpostCount = await prisma.project.count({ where: { devpostUrl } });
  const nameCount = await prisma.project.count({ where: { name: submissionName } });

  const eligible = submitted && devpostUrls.length === 1 && devpostCount === 0 && nameCount === 0;

  if (eligible) {
    return { error: false };
  }
  if (!submitted) {
    return {
      error: true,
      message:
        "Please submit your project to the hackathon devpost and try again. Follow the instructions below.",
    };
  }
  if (devpostUrls.length !== 1) {
    return { error: true, message: "You cannot have multiple hackathon submissions." };
  }
  if (devpostCount !== 0) {
    return { error: true, message: "A submission with this Devpost URL already exists." };
  }
  if (nameCount !== 0) {
    return { error: true, message: "A submission with this name already exists." };
  }
  return { error: true, message: "Please contact help desk" };
};
