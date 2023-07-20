import express from "express";
import { asyncHandler, checkAbility } from "@api/common";

import { Prisma } from "@api/prisma/generated";
import { prisma } from "../common";

export const vendorRoutes = express.Router();

vendorRoutes.route("/").get(
  checkAbility("read", "Vendor"),
  asyncHandler(async (req, res) => {
    const filter: Prisma.VendorWhereInput = {};

    if (req.query.isActive) {
      filter.isActive = req.query.isActive === "true";
    }

    const vendors = await prisma.vendor.findMany({
      where: filter,
    });
    return res.status(200).json(vendors);
  })
);

vendorRoutes.route("/:id").get(
  checkAbility("read", "Vendor"),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(vendor);
  })
);

vendorRoutes.route("/").post(
  checkAbility("create", "Vendor"),
  asyncHandler(async (req, res) => {
    const newVendor = await prisma.vendor.create({
      data: {
        ...req.body,
        isActive: req.body.isActive ?? undefined,
      },
    });
    return res.status(200).json(newVendor);
  })
);

vendorRoutes.route("/:id").put(
  checkAbility("update", "Vendor"),
  asyncHandler(async (req, res) => {
    const updatedVendor = await prisma.vendor.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        ...req.body,
        isActive: req.body.isActive ?? undefined,
      },
    });
    return res.status(200).json(updatedVendor);
  })
);
