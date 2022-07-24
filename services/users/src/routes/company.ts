import { asyncHandler, BadRequestError, checkAbility } from "@api/common";
import express from "express";
import { getAuth } from "firebase-admin/auth"; // eslint-disable-line import/no-unresolved

import { CompanyModel } from "../models/company";

export const companyRoutes = express.Router();

companyRoutes.route("/").post(
  checkAbility("create", "Company"),
  asyncHandler(async (req, res) => {
    const { name, defaultEmailDomains, hasResumeAccess, employees } = req.body;

    if (!name) {
      throw new BadRequestError("Please enter the name field at the minimum");
    }

    const newCompany = await CompanyModel.create({
      name,
      defaultEmailDomains,
      hasResumeAccess,
      employees,
    });

    return res.status(200).send(newCompany);
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
    const updatedCompany = await CompanyModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

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

    const emails = req.body.employees.split(",");
    const employeesToAdd: string[] = [];
    const uniqueEmployees: string[] = company.employees;

    emails.forEach(async (email: string) => {
      const user = await getAuth().getUserByEmail(email);
      if (!uniqueEmployees.includes(user.uid)) {
        uniqueEmployees.push(user.uid);
      }
    });

    const currEmployees = await CompanyModel.findByIdAndUpdate(
      req.params.id,
      {
        employees: uniqueEmployees,
      },
      { new: true }
    );

    return res.status(200).send(currEmployees);
  })
);

companyRoutes.route("/:id/employees").put(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id).accessibleBy(req.ability);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    const addEmployees = await CompanyModel.findByIdAndUpdate(
      req.params.id,
      {
        employees: req.body.employees,
      },
      { new: true }
    );

    return res.status(200).send(addEmployees);
  })
);
