-- CreateTable
CREATE TABLE "judging_session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "hexathon" TEXT NOT NULL,
    "currentTableGroupId" INTEGER,
    "minCountOnArrival" INTEGER NOT NULL DEFAULT 0,
    "bannedTableGroupIds" INTEGER[],
    "roomSwitchCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "judging_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "judging_session_hexathon_idx" ON "judging_session"("hexathon");

-- CreateIndex
CREATE UNIQUE INDEX "judging_session_userId_hexathon_key" ON "judging_session"("userId", "hexathon");

-- AddForeignKey
ALTER TABLE "judging_session" ADD CONSTRAINT "judging_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
