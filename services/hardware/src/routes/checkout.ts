import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { prisma } from "../common";

export const checkoutRouter = express.Router();

checkoutRouter.route("/").get(
  checkAbility("read", "Checkout"),
  asyncHandler(async (req, res) => {
    const requestedUserId = req.query.userId ? String(req.query.userId) : undefined;
    const userId = req.user?.roles.admin || req.user?.roles.member ? requestedUserId : req.user?.uid;
    const checkouts = await prisma.checkout.findMany({
      where: { userId },
      include: { inventory: true, user: true, item: true },
      orderBy: { checkedOutAt: "desc" },
    });

    res.status(200).send(checkouts);
  })
);

checkoutRouter.route("/").post(
  checkAbility("create", "Checkout"),
  asyncHandler(async (req, res) => {
    const inventoryId = Number(req.body.inventoryId);
    const quantity = Number(req.body.quantity);
    const userId = typeof req.body.userId === "string" ? req.body.userId : req.user?.uid;

    if (!Number.isInteger(inventoryId) || inventoryId < 1) {
      throw new BadRequestError("A valid inventory ID is required");
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestError("Checkout quantity must be a positive integer");
    }
    if (!userId) {
      throw new BadRequestError("A user ID is required");
    }

    const checkout = await prisma.$transaction(async transaction => {
      const updated = await transaction.inventory.updateMany({
        where: { id: inventoryId, availableQuantity: { gte: quantity } },
        data: { availableQuantity: { decrement: quantity } },
      });
      if (updated.count !== 1) {
        throw new BadRequestError("Not enough inventory is available");
      }

      await transaction.user.upsert({
        where: { userId },
        update: { name: typeof req.body.name === "string" ? req.body.name : undefined },
        create: { userId, name: typeof req.body.name === "string" ? req.body.name : "" },
      });

      return transaction.checkout.create({
        data: { inventoryId, quantity, userId, itemId: req.body.itemId ? Number(req.body.itemId) : undefined },
        include: { inventory: true, user: true, item: true },
      });
    });

    res.status(201).send(checkout);
  })
);

checkoutRouter.route("/:id/return").post(
  checkAbility("update", "Checkout"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestError("A valid checkout ID is required");
    }

    const checkout = await prisma.$transaction(async transaction => {
      const current = await transaction.checkout.findUnique({ where: { id } });
      if (!current || current.returnedAt) {
        throw new BadRequestError("Checkout does not exist or has already been returned");
      }

      await transaction.inventory.update({
        where: { id: current.inventoryId },
        data: { availableQuantity: { increment: current.quantity } },
      });
      const closed = await transaction.checkout.updateMany({
        where: { id, returnedAt: null },
        data: { returnedAt: new Date() },
      });
      if (closed.count !== 1) {
        throw new BadRequestError("Checkout does not exist or has already been returned");
      }

      return transaction.checkout.findUniqueOrThrow({
        where: { id },
        include: { inventory: true, user: true, item: true },
      });
    });

    res.status(200).send(checkout);
  })
);