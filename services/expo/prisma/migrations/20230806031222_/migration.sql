-- CreateIndex
CREATE INDEX "assignment_userId_status_idx" ON "assignment"("userId", "status");

-- CreateIndex
CREATE INDEX "ballot_deleted_criteriaId_idx" ON "ballot"("deleted", "criteriaId");

-- CreateIndex
CREATE INDEX "ballot_userId_idx" ON "ballot"("userId");

-- CreateIndex
CREATE INDEX "category_hexathon_idx" ON "category"("hexathon");

-- CreateIndex
CREATE INDEX "category_group_hexathon_idx" ON "category_group"("hexathon");

-- CreateIndex
CREATE INDEX "criteria_categoryId_idx" ON "criteria"("categoryId");

-- CreateIndex
CREATE INDEX "project_hexathon_idx" ON "project"("hexathon");

-- CreateIndex
CREATE INDEX "project_expo_idx" ON "project"("expo");

-- CreateIndex
CREATE INDEX "project_round_idx" ON "project"("round");

-- CreateIndex
CREATE INDEX "project_table_idx" ON "project"("table");

-- CreateIndex
CREATE INDEX "project_tableGroupId_idx" ON "project"("tableGroupId");

-- CreateIndex
CREATE INDEX "table_group_hexathon_idx" ON "table_group"("hexathon");

-- CreateIndex
CREATE INDEX "user_isJudging_idx" ON "user"("isJudging");

-- CreateIndex
CREATE INDEX "user_isSponsor_idx" ON "user"("isSponsor");

-- CreateIndex
CREATE INDEX "winner_hexathon_idx" ON "winner"("hexathon");

-- CreateIndex
CREATE INDEX "winner_categoryId_idx" ON "winner"("categoryId");
