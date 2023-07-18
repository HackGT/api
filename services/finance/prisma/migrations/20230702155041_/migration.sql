/*
  Warnings:

  - You are about to drop the `Approval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Budget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LineItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OperatingBudget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OperatingLineItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Requisition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequisitionItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_approverId_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_requisitionId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_requisitionId_fkey";

-- DropForeignKey
ALTER TABLE "LineItem" DROP CONSTRAINT "LineItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "OperatingLineItem" DROP CONSTRAINT "OperatingLineItem_operatingBudgetId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_fundingSourceId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_requisitionId_fkey";

-- DropForeignKey
ALTER TABLE "Requisition" DROP CONSTRAINT "Requisition_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "Requisition" DROP CONSTRAINT "Requisition_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Requisition" DROP CONSTRAINT "Requisition_fundingSourceId_fkey";

-- DropForeignKey
ALTER TABLE "Requisition" DROP CONSTRAINT "Requisition_projectId_fkey";

-- DropForeignKey
ALTER TABLE "RequisitionItem" DROP CONSTRAINT "RequisitionItem_lineItemId_fkey";

-- DropForeignKey
ALTER TABLE "RequisitionItem" DROP CONSTRAINT "RequisitionItem_requisitionId_fkey";

-- DropForeignKey
ALTER TABLE "RequisitionItem" DROP CONSTRAINT "RequisitionItem_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToUser" DROP CONSTRAINT "_ProjectToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToUser" DROP CONSTRAINT "_ProjectToUser_B_fkey";

-- DropTable
DROP TABLE "Approval";

-- DropTable
DROP TABLE "Budget";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "LineItem";

-- DropTable
DROP TABLE "OperatingBudget";

-- DropTable
DROP TABLE "OperatingLineItem";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "PaymentMethod";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Requisition";

-- DropTable
DROP TABLE "RequisitionItem";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Vendor";

-- CreateTable
CREATE TABLE "budget" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "budgetId" INTEGER NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_budget" (
    "id" SERIAL NOT NULL,
    "month" "Month" NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "operating_budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_line_item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "operatingBudgetId" INTEGER NOT NULL,

    CONSTRAINT "operating_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval" (
    "id" SERIAL NOT NULL,
    "isApproving" BOOLEAN NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approverId" TEXT NOT NULL,
    "requisitionId" INTEGER NOT NULL,

    CONSTRAINT "approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "googleName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requisitionId" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "fundingSourceId" INTEGER NOT NULL,
    "requisitionId" INTEGER NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reimbursementInstructions" TEXT,
    "isDirectPayment" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "shortCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "referenceString" TEXT NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition" (
    "id" SERIAL NOT NULL,
    "headline" TEXT,
    "description" TEXT,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "projectId" INTEGER NOT NULL,
    "projectRequisitionId" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "paymentRequiredBy" TEXT,
    "otherFees" DOUBLE PRECISION,
    "orderDate" TEXT,
    "shippingLocation" TEXT,
    "isReimbursement" BOOLEAN NOT NULL DEFAULT false,
    "fundingSourceId" INTEGER,
    "budgetId" INTEGER,
    "purchaseDate" TEXT,
    "referenceString" TEXT NOT NULL,

    CONSTRAINT "requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition_item" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "quantity" INTEGER,
    "unitPrice" DOUBLE PRECISION,
    "requisitionId" INTEGER NOT NULL,
    "link" TEXT,
    "notes" TEXT,
    "received" BOOLEAN,
    "lineItemId" INTEGER,
    "vendorId" INTEGER,

    CONSTRAINT "requisition_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_googleName_key" ON "file"("googleName");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_name_key" ON "payment_method"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_referenceString_key" ON "project"("referenceString");

-- CreateIndex
CREATE UNIQUE INDEX "requisition_referenceString_key" ON "requisition"("referenceString");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_name_key" ON "vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_userId_key" ON "user"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_item" ADD CONSTRAINT "line_item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operating_line_item" ADD CONSTRAINT "operating_line_item_operatingBudgetId_fkey" FOREIGN KEY ("operatingBudgetId") REFERENCES "operating_budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "user"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition" ADD CONSTRAINT "requisition_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition" ADD CONSTRAINT "requisition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition" ADD CONSTRAINT "requisition_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition" ADD CONSTRAINT "requisition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_item" ADD CONSTRAINT "requisition_item_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "line_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_item" ADD CONSTRAINT "requisition_item_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_item" ADD CONSTRAINT "requisition_item_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToUser" ADD CONSTRAINT "_ProjectToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToUser" ADD CONSTRAINT "_ProjectToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
