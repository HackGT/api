import { AbilityAction } from "@api/common";
import { AbilityBuilder, Ability, Subject } from "@casl/ability";
import { RequestHandler } from "express";

import { CompanyModel } from "./models/company";

export const addAbilities = (): RequestHandler => async (req, res, next) => {
  const { can, build } = new AbilityBuilder<Ability<[AbilityAction, Subject]>>(Ability);

  const isSponsorWithResumeAccess = async (user: any) => {
    const company = await CompanyModel.findOne({ employees: user.uid });
    return company?.hasResumeAccess;
  };

  if (!req.user) {
    req.ability = build();
    next();
    return;
  }

  if (req.user.roles.admin) {
    can("manage", "Profile");
    can("delete", "Company");
    can("create", "Company");
  }
  const hasResumeAccess = await isSponsorWithResumeAccess(req.user);
  if (req.user.roles.member || hasResumeAccess) {
    can("read", "Profile");
  }

  if (req.user.roles.admin || req.user.roles.member) {
    can("manage", "Company");
    can("manage", "Team");
  }

  can("manage", "Profile", { userId: req.user.uid });
  can("manage", "Team", { members: req.user.uid });
  can("read", "Company");
  can("manage", "Company");

  req.ability = build();
  next();
};
