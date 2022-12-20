/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { GraphQLError } from "graphql";

import { User } from "@api/prisma/generated";
import { uploadFiles } from "../../util/googleUpload";
import { sendSlackNotification } from "../../util/slack";
import {
  APPROVAL_INCLUDE,
  CATEGORY_INCLUDE,
  connectOrDisconnect,
  connectOrUndefined,
  PAYMENT_INCLUDE,
  PROJECT_INCLUDE,
  REQUISITION_INCLUDE,
} from "./common";
import { prisma } from "../../common";
import {
  MutationCreateApprovalArgs,
  MutationCreateCategoryArgs,
  MutationCreatePaymentArgs,
  MutationCreatePaymentMethodArgs,
  MutationCreateProjectArgs,
  MutationCreateRequisitionArgs,
  MutationCreateVendorArgs,
  MutationCreateBudgetArgs,
  MutationCreateLineItemArgs,
  MutationUpdateCategoryArgs,
  MutationUpdatePaymentMethodArgs,
  MutationUpdateProjectArgs,
  MutationUpdateRequisitionArgs,
  MutationUpdateUserArgs,
  MutationUpdateVendorArgs,
  MutationUpdateBudgetArgs,
  MutationUpdateLineItemArgs,
} from "../../generated/types";

const updateUser = async function updateUser(parent: any, args: MutationUpdateUserArgs) {
  return await prisma.user.update({
    where: {
      id: args.id,
    },
    data: args.data,
  });
};

const createRequisition = async function createRequisition(
  parent: any,
  args: MutationCreateRequisitionArgs,
  context: { user: User }
) {
  if (!args.data.project) {
    throw new GraphQLError("Project must be defined");
  }

  const aggregate = await prisma.requisition.aggregate({
    _max: {
      projectRequisitionId: true,
    },
    where: {
      projectId: args.data.project,
    },
  });

  const { data } = args;

  const createItems = data.items?.map((item: any) => ({
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
      ...data,
      isReimbursement: data.isReimbursement ?? undefined,
      projectRequisitionId: (aggregate._max.projectRequisitionId ?? 0) + 1, // eslint-disable-line no-underscore-dangle
      fundingSource: connectOrUndefined(data.fundingSource),
      budget: connectOrUndefined(data.budget),
      project: { connect: { id: data.project ?? undefined } },
      createdBy: { connect: { id: context.user.id } },
      items: { create: createItems },
      files: undefined,
    },
    include: REQUISITION_INCLUDE,
  });

  await uploadFiles(
    data.files?.map((file: any) => file.originFileObj.promise),
    requisition
  );
  await sendSlackNotification(requisition.id);

  return requisition;
};

const updateRequisition = async function updateRequisition(
  parent: any,
  args: MutationUpdateRequisitionArgs
) {
  const oldRequisition = await prisma.requisition.findFirst({
    where: {
      id: args.id,
    },
    include: {
      files: true,
      items: true,
    },
  });

  if (!oldRequisition) {
    throw new GraphQLError("Requisition not found");
  }

  const { data } = args;

  const itemIds = [];
  if (data.items) {
    let index = 0;
    const oldItems = oldRequisition.items;
    const newItems = data.items;

    while (index < oldItems.length || index < newItems.length) {
      if (index < oldItems.length && index < newItems.length) {
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
        await prisma.requisitionItem.delete({
          where: {
            id: oldItems[index].id,
          },
        });
      } else if (index < newItems.length) {
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

  if (data.files) {
    const filesToUpload = [];
    const existingFileIds: any[] = [];

    for (const file of data.files) {
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
      id: args.id,
    },
    data: {
      ...data,
      isReimbursement: data.isReimbursement ?? undefined,
      fundingSource: connectOrUndefined(data.fundingSource),
      budget: connectOrUndefined(data.budget),
      project: connectOrUndefined(data.project),
      items: itemIds.length === 0 ? undefined : { set: itemIds.map(id => ({ id })) },
      files: undefined,
    },
    include: REQUISITION_INCLUDE,
  });

  if (requisition.status !== oldRequisition.status) {
    sendSlackNotification(requisition.id);
  }

  return requisition;
};

const createProject = async function createProject(parent: any, args: MutationCreateProjectArgs) {
  return await prisma.project.create({
    data: {
      ...args.data,
      archived: args.data.archived ?? false,
      leads: {
        connect: args.data.leads.map((lead: any) => ({ id: lead })),
      },
    },
    include: PROJECT_INCLUDE,
  });
};

const updateProject = async function updateProject(parent: any, args: MutationUpdateProjectArgs) {
  return await prisma.project.update({
    where: {
      id: args.id,
    },
    data: {
      ...args.data,
      archived: args.data.archived ?? undefined,
      leads: {
        set: args.data.leads.map((lead: any) => ({ id: lead })),
      },
    },
    include: PROJECT_INCLUDE,
  });
};

const createVendor = async function createVendor(parent: any, args: MutationCreateVendorArgs) {
  return await prisma.vendor.create({
    data: {
      ...args.data,
      isActive: args.data.isActive ?? undefined,
    },
  });
};

const updateVendor = async function updateVendor(parent: any, args: MutationUpdateVendorArgs) {
  return await prisma.vendor.update({
    where: {
      id: args.id,
    },
    data: {
      ...args.data,
      isActive: args.data.isActive ?? undefined,
    },
  });
};

const createBudget = async function createBudget(parent: any, args: MutationCreateBudgetArgs) {
  return await prisma.budget.create({
    data: {
      ...args.data,
      archived: args.data.archived ?? undefined,
    },
  });
};

const createCategory = async function createCategory(
  parent: any,
  args: MutationCreateCategoryArgs
) {
  return await prisma.category.create({
    data: {
      ...args.data,
      budget: {
        connect: {
          id: args.data.budget,
        },
      },
    },
    include: CATEGORY_INCLUDE,
  });
};

const updateCategory = async function updateCategory(
  parent: any,
  args: MutationUpdateCategoryArgs
) {
  return await prisma.category.update({
    where: {
      id: args.id,
    },
    data: {
      ...args.data,
      budget: {
        connect: {
          id: args.data.budget,
        },
      },
    },
    include: CATEGORY_INCLUDE,
  });
};

const updateBudget = async function updateBudget(parent: any, args: MutationUpdateBudgetArgs) {
  return await prisma.budget.update({
    where: {
      id: args.id,
    },
    data: {
      ...args.data,
      archived: args.data.archived ?? undefined,
    },
  });
};

const createPaymentMethod = async function createPaymentMethod(
  parent: any,
  args: MutationCreatePaymentMethodArgs
) {
  return await prisma.paymentMethod.create({
    data: {
      ...args.data,
      isActive: args.data.isActive ?? undefined,
      isDirectPayment: args.data.isActive ?? undefined,
    },
  });
};

const updatePaymentMethod = async function updatePaymentMethod(
  parent: any,
  args: MutationUpdatePaymentMethodArgs
) {
  return await prisma.paymentMethod.update({
    where: {
      id: args.id,
    },
    data: {
      ...args.data,
      isActive: args.data.isActive ?? undefined,
      isDirectPayment: args.data.isActive ?? undefined,
    },
  });
};

const createPayment = async function createPayment(parent: any, args: MutationCreatePaymentArgs) {
  return await prisma.payment.create({
    data: {
      ...args.data,
      requisition: {
        connect: {
          id: args.data.requisition,
        },
      },
      fundingSource: {
        connect: {
          id: args.data.fundingSource,
        },
      },
    },
    include: PAYMENT_INCLUDE,
  });
};

const createApproval = async function createApproval(
  parent: any,
  args: MutationCreateApprovalArgs,
  context: { user: User }
) {
  return await prisma.approval.create({
    data: {
      ...args.data,
      requisition: {
        connect: {
          id: args.data.requisition,
        },
      },
      approver: {
        connect: {
          id: context.user.id,
        },
      },
    },
    include: APPROVAL_INCLUDE,
  });
};

const createLineItem = async function createLineItem(
  parent: any,
  args: MutationCreateLineItemArgs
) {
  return await prisma.lineItem.create({
    data: {
      ...args.data,
      category: {
        connect: {
          id: args.data.category,
        },
      },
    },
  });
};

const updateLineItem = async function updateLineItem(
  parent: any,
  args: MutationUpdateLineItemArgs
) {
  return await prisma.lineItem.update({
    where: {
      id: args.id,
    },
    data: {
      ...args.data,
      category: {
        connect: {
          id: args.data.category,
        },
      },
    },
  });
};

export const Mutation = {
  updateUser,

  createRequisition,
  updateRequisition,

  createProject,
  updateProject,

  createVendor,
  updateVendor,

  createPaymentMethod,
  updatePaymentMethod,

  createCategory,
  updateCategory,

  createBudget,
  updateBudget,

  createPayment,
  createApproval,

  createLineItem,
  updateLineItem,
};
