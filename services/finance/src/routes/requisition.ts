import express from "express";
import { asyncHandler, BadRequestError } from "@api/common";

import { Prisma } from "@api/prisma/generated";
import { prisma } from "../common";
import {
  APPROVAL_INCLUDE,
  connectOrDisconnect,
  connectOrUndefined,
  PAYMENT_INCLUDE,
  REQUISITION_INCLUDE,
} from "../api/resolvers/common";
import { uploadFiles } from "src/util/googleUpload";
import { sendSlackNotification } from "src/util/slack";

export const requisitionRoutes = express.Router();

requisitionRoutes.route("/").get(
  asyncHandler(async (req, res) => {
    const requisitions = await prisma.requisition.findMany({
      where: {
        createdBy: {
          userId: req.user?.uid,
        },
      },
      include: REQUISITION_INCLUDE,
    });
    return res.status(200).json(requisitions);
  })
);

requisitionRoutes.route("/:code").get(
  asyncHandler(async (req, res) => {
    const [year, shortCode, projectRequisitionId] = req.params.code.split("-");
    const filter: Prisma.RequisitionWhereInput = {
      project: {
        year: parseInt(year),
        shortCode,
      },
      projectRequisitionId: parseInt(projectRequisitionId),
    };

    const requisition = await prisma.requisition.findFirst({
      where: filter,
      include: REQUISITION_INCLUDE,
    });
    return res.status(200).json(requisition);
  })
);

requisitionRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const aggregate = await prisma.requisition.aggregate({
      _max: {
        projectRequisitionId: true,
      },
      where: {
        projectId: req.body.project,
      },
    });

    const createItems = req.body.items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      link: item.link,
      notes: item.notes,
      lineItem: connectOrUndefined(item.lineItem),
      vendor: connectOrUndefined(item.vendor),
    }));

    const requisition = await prisma.requisition.create({
      data: {
        ...req.body,
        isReimbursement: req.body.isReimbursement ?? undefined,
        projectRequisitionId: (aggregate._max.projectRequisitionId ?? 0) + 1, // eslint-disable-line no-underscore-dangle
        fundingSource: connectOrUndefined(req.body.fundingSource),
        budget: connectOrUndefined(req.body.budget),
        project: { connect: { id: req.body.project ?? undefined } },
        createdBy: { connect: { id: req.user?.uid } },
        items: { create: createItems },
        files: undefined,
      },
      include: REQUISITION_INCLUDE,
    });

    await uploadFiles(
      req.body.files?.map((file: any) => file.originFileObj.promise),
      requisition
    );
    await sendSlackNotification(requisition.id);

    return res.status(200).json(requisition);
  })
);

requisitionRoutes.route("/:id").put(
  asyncHandler(async (req, res) => {
    const oldRequisition = await prisma.requisition.findFirst({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        files: true,
        items: true,
      },
    });

    if (!oldRequisition) {
      throw new BadRequestError("Requisition not found");
    }

    const itemIds = [];
    if (req.body.items) {
      let index = 0;
      const oldItems = oldRequisition.items;
      const newItems = req.body.items;

      while (index < oldItems.length || index < newItems.length) {
        if (index < oldItems.length && index < newItems.length) {
          // eslint-disable-next-line no-await-in-loop
          const item = await prisma.requisitionItem.update({
            where: {
              id: oldItems[index].id,
            },
            data: {
              ...newItems[index],
              vendor: connectOrDisconnect(newItems[index].vendor, oldItems[index].vendorId),
              lineItem: connectOrDisconnect(newItems[index].lineItem, oldItems[index].lineItemId),
            },
          });
          itemIds.push(item.id);
        } else if (index < oldItems.length) {
          // eslint-disable-next-line no-await-in-loop
          await prisma.requisitionItem.delete({
            where: {
              id: oldItems[index].id,
            },
          });
        } else if (index < newItems.length) {
          // eslint-disable-next-line no-await-in-loop
          const item = await prisma.requisitionItem.create({
            data: {
              ...newItems[index],
              vendor: connectOrUndefined(newItems[index].vendor),
              lineItem: connectOrUndefined(newItems[index].lineItem),
              requisition: { connect: { id: oldRequisition.id } },
            },
          });
          itemIds.push(item.id);
        }
        index += 1;
      }
    }

    if (req.body.files) {
      const filesToUpload = [];
      const existingFileIds: any[] = [];

      for (const file of req.body.files) {
        if (file.originFileObj) {
          filesToUpload.push(file.originFileObj.promise);
        } else if (file.id) {
          existingFileIds.push(parseInt(file.id));
        }
      }

      await uploadFiles(filesToUpload, oldRequisition);

      for (const inactiveFile of oldRequisition.files.filter(
        file => file.isActive && !existingFileIds.includes(file.id)
      )) {
        // eslint-disable-next-line no-await-in-loop
        await prisma.file.update({
          where: {
            id: inactiveFile.id,
          },
          data: {
            isActive: false,
          },
        });
      }
    }

    const requisition = await prisma.requisition.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        ...req.body,
        isReimbursement: req.body.isReimbursement ?? undefined,
        fundingSource: connectOrUndefined(req.body.fundingSource),
        budget: connectOrUndefined(req.body.budget),
        project: connectOrUndefined(req.body.project),
        items: itemIds.length === 0 ? undefined : { set: itemIds.map(id => ({ id })) },
        files: undefined,
      },
      include: REQUISITION_INCLUDE,
    });

    if (requisition.status !== oldRequisition.status) {
      sendSlackNotification(requisition.id);
    }

    return res.status(200).json(requisition);
  })
);

requisitionRoutes.route("/:id/actions/create-payment").post(
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.create({
      data: {
        ...req.body,
        requisition: {
          connect: {
            id: req.params.id,
          },
        },
        fundingSource: {
          connect: {
            id: req.body.fundingSource,
          },
        },
      },
      include: PAYMENT_INCLUDE,
    });
    return res.status(200).json(payment);
  })
);

requisitionRoutes.route("/:id/actions/create-approval").post(
  asyncHandler(async (req, res) => {
    const approval = await prisma.approval.create({
      data: {
        ...req.body,
        requisition: {
          connect: {
            id: req.params.id,
          },
        },
        approver: {
          connect: {
            id: req.user?.uid,
          },
        },
      },
      include: APPROVAL_INCLUDE,
    });
    return res.status(200).json(approval);
  })
);
