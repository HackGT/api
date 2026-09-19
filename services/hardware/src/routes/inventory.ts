import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";

import { prisma } from "../common";

export const inventoryRouter = express.Router();

inventoryRouter.route("/").get(
  checkAbility("read", "Inventory"),
  asyncHandler(async (_req, res) => {
    const inventory = await prisma.inventory.findMany({
      orderBy: [{ event: "asc" }, { name: "asc" }, { size: "asc" }],
    });

    res.status(200).send(inventory);
  })
);

inventoryRouter.route("/").post(
  checkAbility("create", "Inventory"),
  asyncHandler(async (req, res) => {
    const { name, event, size, quantity, notes } = req.body;
    const parsedQuantity = Number(quantity);

    if (typeof name !== "string" || !name.trim()) {
      throw new BadRequestError("Inventory name is required");
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      throw new BadRequestError("Inventory quantity must be a non-negative integer");
    }

    const inventory = await prisma.inventory.create({
      data: {
        name: name.trim(),
        event: typeof event === "string" && event.trim() ? event.trim() : null,
        size: typeof size === "string" && size.trim() ? size.trim() : null,
        quantity: parsedQuantity,
        availableQuantity: parsedQuantity,
        notes: typeof notes === "string" ? notes.trim() : null,
      },
    });

    res.status(201).send(inventory);
  })
);

inventoryRouter.route("/:id").patch(
  checkAbility("update", "Inventory"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const quantity = req.body.quantity === undefined ? undefined : Number(req.body.quantity);

    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestError("A valid inventory ID is required");
    }
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0)) {
      throw new BadRequestError("Inventory quantity must be a non-negative integer");
    }

    const current = await prisma.inventory.findUnique({ where: { id } });
    if (!current) {
      throw new BadRequestError("Inventory item does not exist");
    }
    if (quantity !== undefined && quantity < current.quantity - current.availableQuantity) {
      throw new BadRequestError("Quantity cannot be less than the amount currently checked out");
    }

    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        name: typeof req.body.name === "string" ? req.body.name.trim() : undefined,
        event: typeof req.body.event === "string" ? req.body.event.trim() : undefined,
        size: typeof req.body.size === "string" ? req.body.size.trim() : undefined,
        notes: typeof req.body.notes === "string" ? req.body.notes.trim() : undefined,
        quantity,
        availableQuantity:
          quantity === undefined
            ? undefined
            : quantity - (current.quantity - current.availableQuantity),
      },
    });

    res.status(200).send(inventory);
  })
);