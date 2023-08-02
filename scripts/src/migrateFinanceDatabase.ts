/* eslint-disable no-await-in-loop */
import config from "@api/config";
import admin from "firebase-admin";
import postgres from "postgres";
import { MongoClient } from "mongodb";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

// admin.initializeApp();

const sqlOld = postgres("postgres://postgres@localhost:5433/finance-default");
const sqlNew = postgres("postgres://postgres@localhost:5555/finance");
const mongoClient = new MongoClient("mongodb://localhost:7777");

const migrateVendors = async () => {
  const vendors = await sqlOld`SELECT * FROM "Vendor"`;
  for (const vendor of vendors) {
    await sqlNew`INSERT INTO "vendor" ${sqlNew(vendor)}`;
    console.log(`Migrated vendor ${vendor.name}`);
  }
  await sqlNew`SELECT setval('vendor_id_seq', (SELECT MAX(id) FROM "vendor"))`;
};

const migratePaymentMethods = async () => {
  const paymentMethods = await sqlOld`SELECT * FROM "PaymentMethod"`;
  for (const paymentMethod of paymentMethods) {
    await sqlNew`INSERT INTO "payment_method" ${sqlNew(paymentMethod)}`;
    console.log(`Migrated payment method ${paymentMethod.name}`);
  }
  await sqlNew`SELECT setval('payment_method_id_seq', (SELECT MAX(id) FROM "payment_method"))`;
};

const migrateBudgets = async () => {
  const budgets = await sqlOld`SELECT * FROM "Budget"`;
  for (const budget of budgets) {
    await sqlNew`INSERT INTO "budget" ${sqlNew(budget)}`;
    console.log(`Migrated budget ${budget.name}`);
  }
  await sqlNew`SELECT setval('budget_id_seq', (SELECT MAX(id) FROM "budget"))`;
};

const migrateCategories = async () => {
  const categories = await sqlOld`SELECT * FROM "Category"`;
  for (const category of categories) {
    await sqlNew`INSERT INTO "category" ${sqlNew(category)}`;
    console.log(`Migrated category ${category.name}`);
  }
  await sqlNew`SELECT setval('category_id_seq', (SELECT MAX(id) FROM "category"))`;
};

const migrateLineItems = async () => {
  const lineItems = await sqlOld`SELECT * FROM "LineItem"`;
  for (const lineItem of lineItems) {
    await sqlNew`INSERT INTO "line_item" ${sqlNew(lineItem)}`;
    console.log(`Migrated line item ${lineItem.name}`);
  }
  await sqlNew`SELECT setval('line_item_id_seq', (SELECT MAX(id) FROM "line_item"))`;
};

const migrateProjects = async () => {
  const projects = await sqlOld`SELECT * FROM "Project"`;
  for (const project of projects) {
    await sqlNew`INSERT INTO "project" ("id", "name", "archived", "shortCode", "year", "referenceString") VALUES (${project.id}, ${project.name}, ${project.archived}, ${project.shortCode}, ${project.year}, ${project.year} || '-' || ${project.shortCode})`;
    console.log(`Migrated project ${project.name}`);
  }
  await sqlNew`SELECT setval('project_id_seq', (SELECT MAX(id) FROM "project"))`;
};

const migrateUsers = async () => {
  const users = await sqlOld`SELECT * FROM "User"`;
  for (const user of users) {
    const firebaseUser = await admin.auth().getUserByEmail(user.email);
    await sqlNew`INSERT INTO "user" ("userId", "email") VALUES (${firebaseUser.uid}, ${user.email})`;
    console.log(`Migrated user ${user.name}`);
  }
};

const migrateRequisitions = async () => {
  const requisitions =
    await sqlOld`SELECT "Requisition".*, "User"."email" FROM "Requisition" LEFT OUTER JOIN "User" ON "Requisition"."createdById" = "User"."id" ORDER BY "Requisition"."id" ASC`;
  for (const requisition of requisitions) {
    const firebaseUser = await admin.auth().getUserByEmail(requisition.email);
    const project = await sqlNew`SELECT * FROM "project" WHERE "id" = ${requisition.projectId}`;
    await sqlNew`INSERT INTO "requisition" ("id", "headline", "description", "projectId", "projectRequisitionId", "createdById", "paymentRequiredBy", "otherFees", "orderDate", "shippingLocation", "isReimbursement", "fundingSourceId", "budgetId", "purchaseDate", "status", "referenceString") VALUES (${requisition.id}, ${requisition.headline}, ${requisition.description}, ${requisition.projectId}, ${requisition.projectRequisitionId}, ${firebaseUser.uid}, ${requisition.paymentRequiredBy}, ${requisition.otherFees}, ${requisition.orderDate}, ${requisition.shippingLocation}, ${requisition.isReimbursement}, ${requisition.fundingSourceId}, ${requisition.budgetId}, ${requisition.purchaseDate}, ${requisition.status}, ${project[0].referenceString} || '-' || ${requisition.projectRequisitionId})`;
    console.log(`Migrated requisition ${requisition.headline}`);
  }
  await sqlNew`SELECT setval('requisition_id_seq', (SELECT MAX(id) FROM "requisition"))`;
};

const migrateRequisitionItems = async () => {
  const requisitionItems = await sqlOld`SELECT * FROM "RequisitionItem"`;
  for (const requisitionItem of requisitionItems) {
    await sqlNew`INSERT INTO "requisition_item" ${sqlNew(requisitionItem)}`;
    console.log(`Migrated requisition item ${requisitionItem.name}`);
  }
  await sqlNew`SELECT setval('requisition_item_id_seq', (SELECT MAX(id) FROM "requisition_item"))`;
};

const migratePayments = async () => {
  const payments = await sqlOld`SELECT * FROM "Payment"`;
  for (const payment of payments) {
    await sqlNew`INSERT INTO "payment" ${sqlNew(payment)}`;
    console.log(`Migrated payment ${payment.date}`);
  }
  await sqlNew`SELECT setval('payment_id_seq', (SELECT MAX(id) FROM "payment"))`;
};

const migrateApprovals = async () => {
  const approvals =
    await sqlOld`SELECT "Approval".*, "User"."email" FROM "Approval" LEFT JOIN "User" ON "Approval"."approverId" = "User"."id" ORDER BY "Approval"."id" ASC`;
  for (const approval of approvals) {
    const firebaseUser = await admin.auth().getUserByEmail(approval.email);
    await sqlNew`INSERT INTO "approval" ("id", "isApproving", "notes", "approverId", "requisitionId", "date") VALUES (${approval.id}, ${approval.isApproving}, ${approval.notes}, ${firebaseUser.uid}, ${approval.requisitionId}, ${approval.date})`;
    console.log(`Migrated approval ${approval.id}`);
  }
  await sqlNew`SELECT setval('approval_id_seq', (SELECT MAX(id) FROM "approval"))`;
};

const migrateProjectToUser = async () => {
  const projectToUsers =
    await sqlOld`SELECT "_ProjectToUser".*, "User"."email" FROM "_ProjectToUser" LEFT JOIN "User" ON "_ProjectToUser"."B" = "User"."id"`;
  for (const projectToUser of projectToUsers) {
    const firebaseUser = await admin.auth().getUserByEmail(projectToUser.email);
    await sqlNew`INSERT INTO "_ProjectToUser" ("A", "B") VALUES (${projectToUser.A}, ${firebaseUser.uid})`;
    console.log(`Migrated projectToUser ${projectToUser.A} ${projectToUser.B}`);
  }
};

const migrateFiles = async () => {
  const GOOGLE_STORAGE_BUCKET = config.common.googleCloud.storageBuckets.finance;
  const filesCollection = mongoClient.db("files").collection<any>("files");
  const files =
    await sqlOld`SELECT "File".*, "User"."email" FROM "File" LEFT JOIN "Requisition" on "File"."requisitionId" = "Requisition"."id" LEFT JOIN "User" on "Requisition"."createdById" = "User"."id" ORDER BY "File"."id" ASC OFFSET 3`;
  for (const file of files) {
    const firebaseUser = await admin.auth().getUserByEmail(file.email);
    const newFile = await filesCollection.insertOne({
      userId: firebaseUser.uid,
      mimeType: file.mimetype,
      name: file.name,
      storageId: file.googleName,
      storageBucket: GOOGLE_STORAGE_BUCKET,
      type: "finance",
    });
    await sqlNew`INSERT INTO "file" ("id", "isActive", "requisitionId") VALUES (${newFile.insertedId.toString()}, ${
      file.isActive
    }, ${file.requisitionId})`;
    console.log(`Migrated file ${newFile.insertedId} [${file.name}]`);
  }
};

const migrateFinanceDatabase = async () => {
  await mongoClient.connect();
  await migrateVendors();
  await migratePaymentMethods();
  await migrateBudgets();
  await migrateCategories();
  await migrateLineItems();
  await migrateProjects();
  await migrateUsers();
  await migrateRequisitions();
  await migrateRequisitionItems();
  await migratePayments();
  await migrateApprovals();
  await migrateProjectToUser();
  await migrateFiles();
};

(async () => {
  await migrateFinanceDatabase();

  console.info("\nDone.");
})();
