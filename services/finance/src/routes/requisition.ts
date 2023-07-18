import express from "express";
import { apiCall, asyncHandler, BadRequestError } from "@api/common";
import { Service } from "@api/config";
import _ from "lodash";

import {
  Approval,
  File,
  Project,
  Requisition,
  RequisitionStatus,
  User,
} from "@api/prisma/generated";
import { prisma } from "../common";
import {
  APPROVAL_INCLUDE,
  connectOrDisconnect,
  connectOrUndefined,
  PAYMENT_INCLUDE,
  REQUISITION_INCLUDE,
} from "../api/resolvers/common";

const getRequisitionPermissions = (
  requisition: Requisition & {
    project: Project & { leads: User[] };
  },
  req: express.Request
) => {
  const unlockedRequisitionStatuses: RequisitionStatus[] = [
    RequisitionStatus.DRAFT,
    RequisitionStatus.PENDING_CHANGES,
  ];
  const projectLeadRequisitionStatuses: RequisitionStatus[] = [
    RequisitionStatus.DRAFT,
    RequisitionStatus.PENDING_CHANGES,
    RequisitionStatus.SUBMITTED,
  ];

  const isProjectLead = requisition.project.leads.some(lead => lead.userId === req.user?.uid);
  const isExec = req.user?.roles.exec ?? false;

  return {
    canEdit:
      isExec ||
      (unlockedRequisitionStatuses.includes(requisition.status) &&
        req.user?.uid === requisition.createdById) ||
      isProjectLead,
    canCancel: isExec,
    canExpense:
      isExec || (isProjectLead && projectLeadRequisitionStatuses.includes(requisition.status)),
  };
};

const fillRequistion = async (
  requisition: Requisition & {
    approvals: (Approval & { approver: User })[];
    project: Project & { leads: User[] };
    files: File[];
  },
  req: express.Request
) => {
  const userProfiles = await apiCall(
    Service.USERS,
    {
      url: "/users/actions/retrieve",
      method: "POST",
      data: {
        userIds: _.flattenDeep([
          requisition.createdById,
          requisition.approvals.map(approval => approval.approverId),
          requisition.project.leads.map(lead => lead.userId),
        ]),
      },
    },
    req
  );
  const files = await apiCall(
    Service.FILES,
    {
      url: "/files/actions/retrieve",
      method: "POST",
      data: {
        fileIds: requisition.files.filter(file => file.isActive).map(file => file.id),
      },
    },
    req
  );

  return {
    ...requisition,
    createdBy: userProfiles.find((user: any) => user.userId === requisition.createdById),
    approvals: requisition.approvals.map(approval => ({
      ...approval,
      approver: userProfiles.find((user: any) => user.userId === approval.approverId),
    })),
    project: {
      ...requisition.project,
      leads: requisition.project.leads.map(lead =>
        userProfiles.find((user: any) => user.userId === lead.userId)
      ),
    },
    files,
    ...getRequisitionPermissions(requisition, req),
  };
};

const fillRequistions = async (
  requisitions: (Requisition & {
    approvals: Approval[];
    project: Project & { leads: User[] };
    files: File[];
  })[],
  req: express.Request
) => {
  const userProfiles = await apiCall(
    Service.USERS,
    {
      url: `/users/actions/retrieve`,
      method: "POST",
      data: {
        userIds: _.flattenDeep([
          requisitions.map(requisition => requisition.createdById),
          requisitions.map(requisition =>
            requisition.approvals.map(approval => approval.approverId)
          ),
          requisitions.map(requisition => requisition.project.leads.map(lead => lead.userId)),
        ]),
      },
    },
    req
  );
  const files = await apiCall(
    Service.FILES,
    {
      url: "/files/actions/retrieve",
      method: "POST",
      data: {
        fileIds: _.flattenDeep(
          requisitions.map(requisition => requisition.files.map(file => file.id))
        ),
      },
    },
    req
  );

  return requisitions.map(requisition => ({
    ...requisition,
    createdBy: userProfiles.find((user: any) => user.userId === requisition.createdById),
    approvals: requisition.approvals.map(approval => ({
      ...approval,
      approver: userProfiles.find((user: any) => user.userId === approval.approverId),
    })),
    project: {
      ...requisition.project,
      leads: requisition.project.leads.map(lead =>
        userProfiles.find((user: any) => user.userId === lead.userId)
      ),
    },
    files: requisition.files.map(file => files.find((anyFile: any) => file.id === anyFile.id)),
    ...getRequisitionPermissions(requisition, req),
  }));
};

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
    if (!requisitions) {
      throw new BadRequestError("Requisition not found");
    }

    const filledRequisitions = await fillRequistions(requisitions, req);
    return res.status(200).json(filledRequisitions);
  })
);

requisitionRoutes.route("/:referenceString").get(
  asyncHandler(async (req, res) => {
    const requisition = await prisma.requisition.findUnique({
      where: {
        referenceString: req.params.referenceString,
      },
      include: REQUISITION_INCLUDE,
    });
    if (!requisition) {
      throw new BadRequestError("Requisition not found");
    }

    const filledRequisition = await fillRequistion(requisition, req);
    return res.status(200).json(filledRequisition);
  })
);

requisitionRoutes.route("/").post(
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: {
        id: req.body.project,
      },
    });

    if (!project) {
      throw new BadRequestError("Project not found");
    }

    const aggregate = await prisma.requisition.aggregate({
      _max: {
        projectRequisitionId: true,
      },
      where: {
        projectId: req.body.project,
      },
    });

    const projectRequisitionId = (aggregate._max.projectRequisitionId ?? 0) + 1; // eslint-disable-line no-underscore-dangle

    const createItems = req.body.items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      link: item.link,
      notes: item.notes,
      lineItem: connectOrUndefined(item.lineItem),
      vendor: connectOrUndefined(item.vendor),
    }));
    const createFiles = req.body.files?.map((file: any) => ({
      id: file.id,
    }));

    const requisition = await prisma.requisition.create({
      data: {
        ...req.body,
        isReimbursement: req.body.isReimbursement ?? undefined,
        projectRequisitionId,
        referenceString: `${project.referenceString}-${projectRequisitionId}`,
        fundingSource: connectOrUndefined(req.body.fundingSource),
        budget: connectOrUndefined(req.body.budget),
        project: { connect: { id: req.body.project ?? undefined } },
        createdBy: { connect: { userId: req.user?.uid } },
        items: { create: createItems },
        files: { create: createFiles },
      },
      include: REQUISITION_INCLUDE,
    });

    // TODO: add in slack notifications
    // await sendSlackNotification(requisition.id);

    const filledRequisition = await fillRequistion(requisition, req);
    return res.status(200).json(filledRequisition);
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
        project: {
          include: {
            leads: true,
          },
        },
      },
    });

    if (!oldRequisition) {
      throw new BadRequestError("Requisition not found");
    }

    // TODO: fix requisition permissions
    const requisitionPermissions = getRequisitionPermissions(oldRequisition, req);
    if (!requisitionPermissions.canEdit) {
      throw new BadRequestError("You do not have permission to edit this requisition");
    }
    if (req.body.status) {
      if (req.body.status === RequisitionStatus.CANCELLED && !requisitionPermissions.canCancel) {
        throw new BadRequestError("You do not have permission to cancel this requisition");
      }
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

    // Make old files inactive
    if (req.body.files) {
      const existingFileIds = oldRequisition.files.map(file => file.id);
      const newFileIds = req.body.files.map((file: any) => file.id);

      await prisma.file.updateMany({
        where: {
          OR: _.difference(existingFileIds, newFileIds).map(id => ({ id })),
        },
        data: {
          isActive: false,
        },
      });
    }

    const connectOrCreateFiles = req.body.files?.map((file: any) => ({
      where: {
        id: file.id,
      },
      create: {
        id: file.id,
      },
    }));

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
        files: { connectOrCreate: connectOrCreateFiles },
      },
      include: REQUISITION_INCLUDE,
    });

    if (requisition.status !== oldRequisition.status) {
      // TODO: add in slack notifications
      // sendSlackNotification(requisition.id);
    }

    const filledRequisition = await fillRequistion(requisition, req);
    return res.status(200).json(filledRequisition);
  })
);

requisitionRoutes.route("/:id/actions/create-payment").post(
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.create({
      data: {
        ...req.body,
        requisition: {
          connect: {
            id: parseInt(req.params.id),
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
            id: parseInt(req.params.id),
          },
        },
        approver: {
          connect: {
            userId: req.user?.uid,
          },
        },
      },
      include: APPROVAL_INCLUDE,
    });
    return res.status(200).json(approval);
  })
);
