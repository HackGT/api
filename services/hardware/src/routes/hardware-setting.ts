import { asyncHandler, checkAbility } from "@api/common";
import express from "express";

import { prisma } from "../common";

export const hardwareSettingRoutes = express.Router();

function updateConfigFields(data: any, fields: string[]) {
  const filtered: any = {};

  Object.keys(data).forEach(key => {
    if (fields.includes(key)) {
      filtered[key] = data[key];
    }
  });

  return prisma.setting.update({
    where: { id: 1 },
    data: filtered,
  });
}

hardwareSettingRoutes.route("/").get(
  checkAbility("read", "HardwareSetting"),
  asyncHandler(async (req, res) => {
    const config = await prisma.setting.findFirst();

    res.status(200).json(config);
  })
);

hardwareSettingRoutes.route("/").post(
  checkAbility("update", "HardwareSetting"),
  asyncHandler(async (req, res) => {
    const updated = await prisma.setting.upsert({
      where: {
        id: 1,
      },
      update: {
        isHardwareRequestsAllowed: req.body.isHardwareRequestsAllowed,
      },
      create: {
        id: 1,
        isHardwareRequestsAllowed: false,
      },
    });

    res.status(200).json(updated);
  })
);
