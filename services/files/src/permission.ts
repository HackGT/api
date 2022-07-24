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
    can("manage", "File");
  }

  if (req.user.roles.member) {
    can("read", "File");
  }

  can("manage", "File", { userId: req.user.uid });

  req.ability = build();
  next();
};
