-- CreateIndex
CREATE INDEX "budget_archived_idx" ON "budget"("archived");

-- CreateIndex
CREATE INDEX "file_isActive_idx" ON "file"("isActive");

-- CreateIndex
CREATE INDEX "payment_method_isActive_idx" ON "payment_method"("isActive");

-- CreateIndex
CREATE INDEX "project_archived_idx" ON "project"("archived");

-- CreateIndex
CREATE INDEX "requisition_projectId_idx" ON "requisition"("projectId");

-- CreateIndex
CREATE INDEX "requisition_createdById_idx" ON "requisition"("createdById");

-- CreateIndex
CREATE INDEX "vendor_isActive_idx" ON "vendor"("isActive");
