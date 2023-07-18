/*
  Warnings:

  - A unique constraint covering the columns `[referenceString]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referenceString]` on the table `Requisition` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Project_referenceString_key" ON "Project"("referenceString");

-- CreateIndex
CREATE UNIQUE INDEX "Requisition_referenceString_key" ON "Requisition"("referenceString");
