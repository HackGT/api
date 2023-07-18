import { Prisma, RequisitionStatus } from "@api/prisma/generated";

export const statusToString = (status: RequisitionStatus) => {
  switch (status) {
    case RequisitionStatus.DRAFT:
      return "Draft";
    case RequisitionStatus.SUBMITTED:
      return "Submitted";
    case RequisitionStatus.PENDING_CHANGES:
      return "Pending Changes";
    case RequisitionStatus.READY_TO_ORDER:
      return "Ready to Order";
    case RequisitionStatus.ORDERED:
      return "Ordered";
    case RequisitionStatus.PARTIALLY_RECEIVED:
      return "Partially Received";
    case RequisitionStatus.RECEIVED:
      return "Received";
    case RequisitionStatus.CLOSED:
      return "Closed";
    case RequisitionStatus.CANCELLED:
      return "Cancelled";
    case RequisitionStatus.READY_FOR_REIMBURSEMENT:
      return "Ready for Reimbursement";
    case RequisitionStatus.AWAITING_INFORMATION:
      return "Awaiting Information";
    case RequisitionStatus.REIMBURSEMENT_IN_PROGRESS:
      return "Reimbursement in Progress";
    default:
      return "Unknown";
  }
};

export const connectOrUndefined = (value?: number | null) => {
  if (value) {
    return { connect: { id: value } };
  }
  return undefined;
};

export const connectOrDisconnect = (value?: number | null, oldValue?: number | null) => {
  if (!value && oldValue) {
    return { disconnect: true };
  }
  if (value) {
    return { connect: { id: value } };
  }
  return undefined;
};

export const PROJECT_INCLUDE = Prisma.validator<Prisma.ProjectInclude>()({
  leads: true,
  requisitions: {
    include: {
      project: {
        include: {
          leads: true,
        },
      },
      items: true,
      createdBy: true,
    },
  },
});

export const CATEGORY_INCLUDE = Prisma.validator<Prisma.CategoryInclude>()({
  lineItems: true,
});

export const REQUISITION_INCLUDE = Prisma.validator<Prisma.RequisitionInclude>()({
  budget: true,
  createdBy: true,
  fundingSource: true,
  approvals: {
    include: {
      approver: true,
    },
  },
  files: true,
  payments: {
    include: {
      fundingSource: true,
    },
  },
  items: {
    include: {
      lineItem: {
        include: {
          category: true,
        },
      },
      vendor: true,
    },
  },
  project: {
    include: {
      leads: true,
      requisitions: true,
    },
  },
});

export const BUDGET_INCLUDE = Prisma.validator<Prisma.BudgetInclude>()({
  categories: {
    include: {
      lineItems: true,
    },
  },
  requisitions: {
    include: {
      budget: true,
      items: true,
    },
  },
});

export const APPROVAL_INCLUDE = Prisma.validator<Prisma.ApprovalInclude>()({
  requisition: {
    include: {
      approvals: {
        include: {
          approver: true,
        },
      },
    },
  },
});

export const PAYMENT_INCLUDE = Prisma.validator<Prisma.PaymentInclude>()({
  requisition: {
    include: {
      payments: {
        include: {
          fundingSource: true,
        },
      },
    },
  },
});
