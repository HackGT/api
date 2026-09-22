import express from "express";
import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { FilterQuery } from "mongoose";

import { ApiKey, ApiKeyModel } from "../models/apiKey";
import { HexathonUserModel } from "../models/hexathonUser";

export const apiKeyRouter = express.Router();

apiKeyRouter.route("/claim").post(
  checkAbility("read", "ApiKey"),
  asyncHandler(async (req, res) => {
    if (!req.body.hexathon) {
      throw new BadRequestError("Hexathon is required body field");
    }

    const filter = {
      hexathon: String(req.body.hexathon),
      provider: String(req.body.provider ?? "openai"),
    };

    const hexathonUser = await HexathonUserModel.findOne({
      userId: req.user?.uid,
      hexathon: filter.hexathon,
    });
    if (!hexathonUser) {
      throw new BadRequestError("You are not checked in to this hexathon.");
    }

    const existing = await ApiKeyModel.findOne({ ...filter, hexathonUser: hexathonUser.id });
    if (existing) {
      return res.send(existing);
    }

    let claimed;
    try {
      claimed = await ApiKeyModel.findOneAndUpdate(
        { ...filter, hexathonUser: null },
        { hexathonUser: hexathonUser.id, claimedAt: new Date() },
        { new: true }
      );
    } catch (err: any) {
      if (err.code !== 11000) {
        throw err;
      }
      return res.send(await ApiKeyModel.findOne({ ...filter, hexathonUser: hexathonUser.id }));
    }

    if (!claimed) {
      throw new BadRequestError("No API keys are available. Please contact an organizer.");
    }
    return res.send(claimed);
  })
);

apiKeyRouter.route("/").get(
  checkAbility("aggregate", "ApiKey"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon is required parameter");
    }

    const filter: FilterQuery<ApiKey> = {
      hexathon: String(req.query.hexathon),
    };
    if (req.query.provider) {
      filter.provider = String(req.query.provider);
    }
    if (req.query.claimed === "true") {
      filter.hexathonUser = { $type: "objectId" };
    } else if (req.query.claimed === "false") {
      filter.hexathonUser = null;
    }

    const keys = await ApiKeyModel.find(filter)
      .populate("hexathonUser", "name email userId")
      .sort({ claimedAt: -1 });
    const providers = await ApiKeyModel.distinct("provider", {
      hexathon: String(req.query.hexathon),
    });
    const claimed = keys.filter(apiKey => apiKey.hexathonUser).length;

    return res.send({
      total: keys.length,
      claimed,
      available: keys.length - claimed,
      providers,
      keys,
    });
  })
);

apiKeyRouter.route("/").post(
  checkAbility("create", "ApiKey"),
  asyncHandler(async (req, res) => {
    const { hexathon, keys } = req.body;
    if (!hexathon || !Array.isArray(keys) || keys.length === 0) {
      throw new BadRequestError("Hexathon and a non-empty keys array are required body fields");
    }

    const provider = String(req.body.provider ?? "openai");
    const created = await ApiKeyModel.insertMany(
      keys.map((key: string) => ({ hexathon: String(hexathon), provider, key: String(key).trim() }))
    );

    return res.send({ inserted: created.length });
  })
);
