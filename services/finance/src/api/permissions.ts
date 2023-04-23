import { rule } from "graphql-shield";

import { AccessLevel, RequisitionStatus, User } from "@api/prisma/generated";
import { prisma } from "../common";

const UNLOCKED_REQUISITION_STATUSES = [RequisitionStatus.DRAFT, RequisitionStatus.PENDING_CHANGES];

// HELPER METHODS
export const isExec = (user: any) =>
  [AccessLevel.EXEC, AccessLevel.ADMIN].includes(user.accessLevel);

export const isProjectLead = (user: any, requisition: any) => {
  const projectLeads = requisition.project.leads.map((lead: any) => lead.id);

  return projectLeads.includes(user.id);
};

// PERMISSION METHODS FOR GRAPHQL
export const canEdit = async (parent: any, args: any, context: { user: User }) => {
  // Do the following below hacks, since the permission function is run once before and once after each resolver
  const currentRequisition = await prisma.requisition.findUnique({
    where: {
      id: parent?.id || args?.id,
    },
    include: {
      createdBy: true,
      project: {
        include: {
          leads: true,
        },
      },
    },
  });

  if (!currentRequisition) {
    return true;
  }

  return (
    isExec(context.user) ||
    // @ts-ignore - Requisition is unlocked and user is the creator
    (UNLOCKED_REQUISITION_STATUSES.includes(currentRequisition.status) &&
      context.user.id === currentRequisition.createdBy.id) ||
    isProjectLead(context.user, currentRequisition)
  );
};

export const canCancel = (parent: any, args: any, context: { user: User }) => isExec(context.user);

export const canExpense = (parent: any, args: any, context: { user: User }) =>
  isExec(context.user) ||
  (isProjectLead(context.user, parent) &&
    [
      RequisitionStatus.DRAFT,
      RequisitionStatus.PENDING_CHANGES,
      RequisitionStatus.SUBMITTED,
    ].includes(parent.status));

export const canViewAdminPanel = (parent: any, args: any, context: { user: User }) =>
  isExec(context.user);

// RULES FOR GRAPHQL SHIELD
export const isAuthenticatedRule = rule({ cache: "contextual" })(
  async (parent: any, args: any, context: { user: User }) =>
    context.user !== null && context.user.accessLevel !== AccessLevel.NONE
);

export const isExecRule = rule({
  cache: "contextual",
})(async (parent: any, args: any, context: { user: User }) => isExec(context.user));

export const canEditRule = rule()(canEdit);

export const canExpenseRule = rule()(canExpense);

export const fallbackRule = rule({ cache: false })(async (parent, args, ctx, info) => {
  switch (info.parentType.name) {
    case "Query":
    case "Mutation":
      return false;
    default:
      // Allow types and fields
      return true;
  }
});
