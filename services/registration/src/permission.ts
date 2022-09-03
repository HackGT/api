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
    can("manage", "Application");
    can("manage", "Branch");
    can("manage", "Grader");
    can("manage", "Review");
  }

  if (req.user.roles.member) {
    can("read", "Application");
    can("read", "Grader");
    can("manage", "Grader", { userId: req.user.uid });
    can("read", "Review");
    can("manage", "Review", { reviewerId: req.user.uid });
    can("create", "Email");
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
