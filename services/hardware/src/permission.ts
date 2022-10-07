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

  if (req.user.roles.admin) {
    can("manage", "Item");
    can("manage", "Category");
    can("manage", "Location");
    can("manage", "Request");
    can("manage", "Cart");
  }

  if (req.user.roles.member) {
    can("read", "Application");
    can("read", "Grader");
    can("manage", "Grader", { userId: req.user.uid });
    can("read", "Review");
    can("manage", "Review", { reviewerId: req.user.uid });
    can("create", "Email");
    can("create", "Cart");
  }

  if (req.user.roles.admin || req.user.roles.member) {
    can("aggregate", "Application");
    can("aggregate", "Review");
  }

  can(["create", "read", "update"], "Application", { userId: req.user.uid });
  can("read", "Branch");

  req.ability = build();
  next();
};
