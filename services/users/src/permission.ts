import { AbilityAction } from "@api/common";
import { AbilityBuilder, Ability, Subject } from "@casl/ability";
import { RequestHandler } from "express";
import { CompanyModel } from "./models/company";

export const addAbilities = (): RequestHandler => (req, res, next) => {
  const { can, build } = new AbilityBuilder<Ability<[AbilityAction, Subject]>>(Ability);

  const isSponsorWithResumeAccess = (user: any) => {
    const company = CompanyModel.find({ employees: user.uid });
    return user.roles.sponsor && company.hasResumeAccess
  }

  if (!req.user) {
    req.ability = build();
    next();
    return;
  }

  if (req.user.roles.admin) {
    can("manage", "Profile");
  }

  if (req.user.roles.member || isSponsorWithResumeAccess(req.user)) {
    can("read", "Profile");
  }

  if (req.user.roles.admin || req.user.roles.member) {
    can("manage", "Company");
    can("manage", "Team");
  }

  can("manage", "Profile", { userId: req.user.uid });
  can("manage", "Team", { members: req.user.uid });
  can("read", "Company");

  req.ability = build();
  next();
};
