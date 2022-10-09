import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { getAuth } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved
import { FilterQuery } from "mongoose";

import { Company, CompanyModel } from "../models/company";

export const companyRoutes = express.Router();

companyRoutes.route("/").post(
  checkAbility("create", "Company"),
  asyncHandler(async (req, res) => {
    const { name, description, defaultEmailDomains, hasResumeAccess, employees, hexathon } =
      req.body;

    if (!name || !hexathon) {
      throw new BadRequestError("Please enter the name and hexathon field at the minimum");
    }

    const existingCompany = await CompanyModel.findOne({
      name,
      hexathon,
    });

    if (existingCompany) {
      throw new BadRequestError("Company profile already exists for specified hexathon");
    }

    const newCompany = await CompanyModel.create({
      name,
      description,
      hexathon,
      defaultEmailDomains,
      hasResumeAccess,
      employees,
    });

    return res.status(200).send(newCompany);
  })
);

companyRoutes.route("/").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<Company> = {};

    if (req.query.hexathon) {
      filter.hexathon = String(req.query.hexathon);
    }

    const companies = await CompanyModel.accessibleBy(req.ability).find(filter);
    return res.status(200).send(companies);
  })
);

companyRoutes.route("/:id").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    return res.status(200).send(company);
  })
);

companyRoutes.route("/:id").put(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    if (!req.user?.roles.member && !company.employees.includes(req.user?.uid ?? "")) {
      throw new BadRequestError("Invalid company ID for insufficient permissions");
    }

    const updatedCompany = await company.update(req.body, { new: true });
    return res.status(200).send(updatedCompany);
  })
);

companyRoutes.route("/:id").delete(
  checkAbility("delete", "Company"),
  asyncHandler(async (req, res) => {
    await CompanyModel.findByIdAndDelete(req.params.id);
    return res.sendStatus(204);
  })
);

// get company based on employee id provided
companyRoutes.route("/employees/:employeeId").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    if (!req.query.hexathon) {
      throw new BadRequestError("Hexathon filter is required");
    }

    const company = await CompanyModel.find({
      employees: req.params.employeeId,
      hexathon: req.query.hexathon,
    }).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError(
        "Company not found for given hexathon or you do not have permission."
      );
    }

    return res.status(200).send(company);
  })
);

// used for accepting employee join requests
companyRoutes.route("/:id/employees/accept-request").post(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    if (!req.user?.roles.member && !company.employees.includes(req.user?.uid ?? "")) {
      throw new BadRequestError("Invalid company ID for insufficient permissions");
    }

    const { employeeId } = req.body;

    if (company.employees.includes(employeeId)) {
      throw new BadRequestError("User already in company");
    }

    if (!company.pendingEmployees.includes(employeeId)) {
      throw new BadRequestError("User not in pending employees list");
    }

    const updatedCompany = await company.update(
      {
        employees: [...company.employees, employeeId],
        $pull: {
          pendingEmployees: employeeId,
        },
      },
      { new: true }
    );

    return res.status(200).send(updatedCompany);
  })
);

companyRoutes.route("/:id/employees/add").post(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    if (!req.user?.roles.member && !company.employees.includes(req.user?.uid ?? "")) {
      throw new BadRequestError("Invalid company ID for insufficient permissions");
    }

    const emails: string[] = req.body.employees.split(",");
    const uniqueEmployees: string[] = company.employees;

    await Promise.all(
      emails.map(async email => {
        const user = await getAuth().getUserByEmail(email);
        if (!uniqueEmployees.includes(user.uid)) {
          uniqueEmployees.push(user.uid);
        }
      })
    );

    const updatedCompany = await company.update({
      members: uniqueEmployees,
      $pull: {
        pendingEmployees: { $in: uniqueEmployees },
      },
    });

    return res.status(200).send(updatedCompany);
  })
);

companyRoutes.route("/:id/employees/request").post(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      req.params.id,
      {
        pendingEmployees: [...company.pendingEmployees, req.user?.uid],
      },
      { new: true }
    );

    return res.status(200).send(updatedCompany);
  })
);

companyRoutes.route("/:id/employees").delete(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    if (!req.user?.roles.member && !company.employees.includes(req.user?.uid ?? "")) {
      throw new BadRequestError("Invalid company ID for insufficient permissions");
    }

    await company.update({
      $pull: {
        pendingEmployees: req.body.userId,
        employees: req.body.userId,
      },
    });

    return res.status(204).send(company);
  })
);
