import { AbilityAction } from "@api/common";
import { AbilityBuilder, Ability, Subject } from "@casl/ability";
import { RequestHandler } from "express";

export const addAbilities = (): RequestHandler => (req, res, next) => {
  const { can, build } = new AbilityBuilder<Ability<[AbilityAction, Subject]>>(Ability);

  if (!req.user) {
    req.ability = build();
    next();
    return;
  }

  if (req.user.roles.exec) {
    can("manage", "Payment"); // Only execs can create payments
  }

  if (req.user.roles.exec || req.user.roles.admin) {
    can("manage", "Project");
    can("manage", "Budget");
    can("manage", "PaymentMethod");
    can("manage", "Vendor");
  }

  if (req.user.roles.member) {
    can("read", "Project");
    can("read", "Budget");
    can("read", "PaymentMethod");
    can("read", "Vendor");
    can("manage", "Requisition"); // There are further specific permission checks in the requisition routes
    can("manage", "Approval"); // Project leads can approve requisitions
  }

  req.ability = build();
  next();
};
