import { apiCall, asyncHandler, BadRequestError, checkAbility } from "@api/common";
import { Service } from "@api/config";
import express from "express";
import { getAuth } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved
import { FilterQuery } from "mongoose";

import { Company, CompanyModel } from "../models/company";

const populateCompanyEmployees = async (company: Company | null, req: express.Request) => {
  if (!company) {
    throw new BadRequestError("Error updating company");
  }

  const users = await apiCall(
    Service.USERS,
    {
      url: "/users/actions/retrieve",
      method: "POST",
      data: {
        userIds: company.employees.concat(company.pendingEmployees),
      },
    },
    req
  );

  return {
    ...company.toJSON(),
    employees: users.filter((user: any) => company.employees.includes(user.userId)),
    pendingEmployees: users.filter((user: any) => company.pendingEmployees.includes(user.userId)),
  };
};

export const companyRoutes = express.Router();

companyRoutes.route("/").post(
  checkAbility("create", "Company"),
  asyncHandler(async (req, res) => {
    const { name, description, defaultEmailDomains, hasResumeAccess, hexathon } = req.body;

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

    const companyEmployeeUserIds = companies.map(company => company.employees).flat();
    const companyPendingEmployeeUserIds = companies.map(company => company.pendingEmployees).flat();

    const users = await apiCall(
      Service.USERS,
      {
        url: "/users/actions/retrieve",
        method: "POST",
        data: {
          userIds: companyEmployeeUserIds.concat(companyPendingEmployeeUserIds),
        },
      },
      req
    );

    const companiesWithProfiles = companies.map(company => ({
      ...company.toJSON(),
      employees: users.filter((user: any) => company.employees.includes(user.userId)),
      pendingEmployees: users.filter((user: any) => company.pendingEmployees.includes(user.userId)),
    }));

    return res.status(200).send(companiesWithProfiles);
  })
);

companyRoutes.route("/:id").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    const companyWithProfiles = await populateCompanyEmployees(company, req);

    return res.status(200).send(companyWithProfiles);
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

    const updatedCompany = await CompanyModel.findOneAndUpdate(company.id, req.body, { new: true });
    const companyWithProfiles = await populateCompanyEmployees(updatedCompany, req);

    return res.status(200).send(companyWithProfiles);
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

    const company = await CompanyModel.findOne({
      employees: req.params.employeeId,
      hexathon: req.query.hexathon,
    }).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError(
        "Company not found for given hexathon or you do not have permission."
      );
    }

    const companyWithProfiles = await populateCompanyEmployees(company, req);

    return res.status(200).send(companyWithProfiles);
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

    const updatedCompany = await CompanyModel.findOneAndUpdate(
      company.id,
      {
        employees: [...company.employees, employeeId],
        $pull: {
          pendingEmployees: employeeId,
        },
      },
      { new: true }
    );
    const companyWithProfiles = await populateCompanyEmployees(updatedCompany, req);

    return res.status(200).send(companyWithProfiles);
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

    const updatedCompany = await CompanyModel.findOneAndUpdate(
      company.id,
      {
        employees: uniqueEmployees,
        $pull: {
          pendingEmployees: { $in: uniqueEmployees },
        },
      },
      { new: true }
    );
    const companyWithProfiles = await populateCompanyEmployees(updatedCompany, req);

    return res.status(200).send(companyWithProfiles);
  })
);

companyRoutes.route("/:id/employees/request").post(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    const updatedCompany = await CompanyModel.findOneAndUpdate(
      company.id,
      {
        pendingEmployees: [...company.pendingEmployees, req.user?.uid],
      },
      { new: true }
    );
    const companyWithProfiles = await populateCompanyEmployees(updatedCompany, req);

    return res.status(200).send(companyWithProfiles);
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

    const updatedCompany = await CompanyModel.findOneAndUpdate(
      company.id,
      {
        $pull: {
          pendingEmployees: req.body.userId,
          employees: req.body.userId,
        },
      },
      { new: true }
    );
    const companyWithProfiles = await populateCompanyEmployees(updatedCompany, req);

    return res.status(204).send(companyWithProfiles);
  })
);
