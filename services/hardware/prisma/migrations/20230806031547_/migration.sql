-- CreateIndex
CREATE INDEX "item_locationId_idx" ON "item"("locationId");

-- CreateIndex
CREATE INDEX "location_hidden_idx" ON "location"("hidden");

-- CreateIndex
CREATE INDEX "request_userId_idx" ON "request"("userId");

-- CreateIndex
CREATE INDEX "request_status_idx" ON "request"("status");
