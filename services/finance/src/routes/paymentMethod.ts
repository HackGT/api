import express from "express";
import { asyncHandler, checkAbility } from "@api/common";

import { Prisma } from "@api/prisma-finance/generated";
import { prisma } from "../common";

export const paymentMethodRoutes = express.Router();

paymentMethodRoutes.route("/").get(
  checkAbility("read", "PaymentMethod"),
  asyncHandler(async (req, res) => {
    const filter: Prisma.PaymentMethodWhereInput = {};

    if (req.query.isActive) {
      filter.isActive = req.query.isActive === "true";
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: filter,
    });
    return res.status(200).json(paymentMethods);
  })
);

paymentMethodRoutes.route("/").post(
  checkAbility("create", "PaymentMethod"),
  asyncHandler(async (req, res) => {
    const newPaymentMethod = await prisma.paymentMethod.create({
      data: {
        ...req.body,
        isActive: req.body.isActive ?? undefined,
        isDirectPayment: req.body.isActive ?? undefined,
      },
    });
    return res.status(200).json(newPaymentMethod);
  })
);

paymentMethodRoutes.route("/:id").put(
  checkAbility("update", "PaymentMethod"),
  asyncHandler(async (req, res) => {
    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        ...req.body,
        isActive: req.body.isActive ?? undefined,
        isDirectPayment: req.body.isActive ?? undefined,
      },
    });
    return res.status(200).json(updatedPaymentMethod);
  })
);
