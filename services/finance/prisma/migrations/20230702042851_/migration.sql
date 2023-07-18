/*
  Warnings:

  - Added the required column `referenceString` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceString` to the `Requisition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "referenceString" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Requisition" ADD COLUMN     "referenceString" TEXT NOT NULL;
