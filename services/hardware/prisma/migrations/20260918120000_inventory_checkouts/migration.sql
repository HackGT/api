-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "event" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "checkedOutAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMPTZ(6),
    "inventoryId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" INTEGER,
    CONSTRAINT "checkout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_event_size_idx" ON "inventory"("event", "size");
CREATE INDEX "checkout_inventoryId_returnedAt_idx" ON "checkout"("inventoryId", "returnedAt");
CREATE INDEX "checkout_userId_returnedAt_idx" ON "checkout"("userId", "returnedAt");

ALTER TABLE "checkout" ADD CONSTRAINT "checkout_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;