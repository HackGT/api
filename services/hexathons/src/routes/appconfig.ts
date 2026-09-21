import express from "express";
import { asyncHandler, BadRequestError, checkAbility, hasAtLeastMemberPerms } from "@api/common";
import { isValidObjectId, Types } from "mongoose";

import { AppConfigModel } from "../models/appconfig";
import { Hexathon, HexathonModel } from "../models/hexathon";

export const appconfigRoutes = express.Router();

/**
 * READ THIS (HUMAN WRITTEN SUMMARY)
 *
 * this is a global config storage for all our apps,
 * for now it only stores the current hexathon id for apps that depend on one.
 * (e.g. livesite needing a current hexathon to show events/data for)
 *
 * The structure is each thing we make (app, expo, livesite, etc.)
 * has its own hardcoded appname, and we can set overrides for each one.
 * if there isnt an override set for an appname it defaults to the global.
 *
 * The mongo structure is:
 * one single document labeled with _id="current"
 * in the hexathons db, appconfigs collection
 *
 * that one document has globalHexathonId and an overrides map
 * which maps from appname strings to hexathon object ids.
 */

appconfigRoutes.route("/all").get(
  checkAbility("manage", "AppConfig"),
  asyncHandler(async (req, res) => {
    const config = await AppConfigModel.findOne({ _id: "current" })
      .populate<{ globalHexathonId: Hexathon | null }>("globalHexathonId")
      .populate<{ overrides: Map<string, Hexathon | null> }>("overrides.$*");

    if (!config) {
      return res.status(500).json({ message: "AppConfig document not found" });
    }
    if (!config.globalHexathonId) {
      return res.status(404).json({ message: "Global Hexathon is not configured" });
    }

    const overrides: Record<string, Hexathon> = {};
    for (const [appname, hexathon] of config.overrides.entries()) {
      if (!hexathon) {
        return res.status(404).json({
          message: `Configured Hexathon for appname=${appname} does not exist`,
        });
      }
      overrides[appname] = hexathon;
    }

    return res.status(200).json({
      global: config.globalHexathonId,
      overrides,
    });
  })
);

appconfigRoutes.route("/").get(
  checkAbility("read", "AppConfig"),
  asyncHandler(async (req, res) => {
    const config = await AppConfigModel.findOne({ _id: "current" })
      .populate<{ globalHexathonId: Hexathon | null }>("globalHexathonId")
      .populate<{ overrides: Map<string, Hexathon | null> }>("overrides.$*");

    if (!config) {
      console.error(
        "AppConfig document not found in database. who tf deleted it?? Please set it by POSTing to /appconfig with a global hexathon id."
      );
      return res.status(500).json({
        message: "Configuration for the current hexathon is not yet set. Please report this!",
      });
    }

    const appname = req.query.appname ? String(req.query.appname) : null;

    let hexathon: Hexathon | null = config.globalHexathonId;
    let source = "global";

    if (appname !== null) {
      // appname given, try searching for override
      const overrideVal = config.overrides.get(appname);
      if (overrideVal) {
        hexathon = overrideVal;
        source = "override";
      }
    }

    // hexathon isnt real.. so the config is messed up??
    if (!hexathon) {
      console.error(`
				Configured hexathon for appname=${appname} (${source}) does not seem to exist.
				Please check mongo for the configured hexathon id, the thing it pointed to might've been deleted?
			`);
      return res
        .status(404)
        .json({
          message:
            "No Hexathon is configured, or you do not have access to this specific hexathon.",
        });
    }

    // if hexathon is dev, requires member role to access
    if (hexathon.isDev && (!req.user || !hasAtLeastMemberPerms(req.user.roles))) {
      return res
        .status(404)
        .json({
          message:
            "No Hexathon is configured, or you do not have access to this specific hexathon.",
        });
    }

    return res.status(200).json({
      appname,
      currentHexathon: {
        id: hexathon._id /* eslint-disable-line no-underscore-dangle */,
        ...hexathon.toObject(),
      },
      source,
    });
  })
);

appconfigRoutes.route("/").post(
  checkAbility("manage", "AppConfig"),
  asyncHandler(async (req, res) => {
    const { appname, value } = req.body;

    if (appname !== null && typeof appname !== "string") {
      throw new BadRequestError("appname must be a string or null");
    }
    if (appname !== null && !/^[A-Za-z0-9_-]+$/.test(appname)) {
      throw new BadRequestError(
        "appname must contain only letters, numbers, underscores, and hyphens"
      );
    }
    if (typeof value !== "string" || !isValidObjectId(value)) {
      throw new BadRequestError("value must be a valid Hexathon id");
    }

    const hexathonExists = await HexathonModel.exists({ _id: value });
    if (!hexathonExists) {
      throw new BadRequestError("Hexathon not found");
    }

    const update =
      appname === null
        ? { $set: { globalHexathonId: new Types.ObjectId(value) } }
        : { $set: { [`overrides.${appname}`]: new Types.ObjectId(value) } };

    await AppConfigModel.findOneAndUpdate({ _id: "current" }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return res.status(200).json({ appname, value });
  })
);
