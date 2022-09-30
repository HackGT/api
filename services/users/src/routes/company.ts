import {
  apiCall,
  asyncHandler,
  BadRequestError,
  checkAbility,
  DEFAULT_USER_ROLES,
} from "@api/common";
import express from "express";
import { Service } from "@api/config";

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

// get company based on employee id provided
companyRoutes.route("/employees/:employeeId").get(
  checkAbility("read", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findOne({ employees: req.params.employeeId });

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    return res.status(200).send(company);
  })
);

companyRoutes.route("/:id/employees/add").post(
  checkAbility("update", "Company"),
  asyncHandler(async (req, res) => {
    const company = await CompanyModel.findById(req.params.id);

    if (!company) {
      throw new BadRequestError("Company not found or you do not have permission.");
    }

    const employeesToAdd = req.body.employees.split(",");
    const uniqueEmployees: string[] = company.employees;

    const handleEmployees = new Promise<void>((resolve, reject) => {
      employeesToAdd.forEach(async (employeeUid: string, index: number, employees: string[]) => {
        const permission = await apiCall(
          Service.AUTH,
          { method: "GET", url: `/permissions/${employeeUid}` },
          req
        );

        let updatedRoles;
        if (permission) {
          updatedRoles = permission.roles;
        } else {
          updatedRoles = DEFAULT_USER_ROLES;
        }

        updatedRoles.sponsor = true;

        await apiCall(
          Service.AUTH,
          {
            method: "POST",
            url: `/permissions/${employeeUid}`,
            data: {
              roles: updatedRoles,
            },
          },
          req
        );

        if (!uniqueEmployees.includes(employeeUid)) {
          uniqueEmployees.push(employeeUid);
        }
        if (index === employees.length - 1) resolve();
      });
    });

    handleEmployees.then(async () => {
      const currEmployees = await CompanyModel.findByIdAndUpdate(
        req.params.id,
        {
          employees: uniqueEmployees,
        },
        { new: true }
      );

      return res.status(200).send(currEmployees);
    });
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
