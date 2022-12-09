-- DropForeignKey
ALTER TABLE "assignment" DROP CONSTRAINT "assignment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "assignment" DROP CONSTRAINT "assignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ballot" DROP CONSTRAINT "ballot_criteriaId_fkey";

-- DropForeignKey
ALTER TABLE "ballot" DROP CONSTRAINT "ballot_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ballot" DROP CONSTRAINT "ballot_userId_fkey";

-- DropForeignKey
ALTER TABLE "criteria" DROP CONSTRAINT "criteria_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_senderId_fkey";

-- DropForeignKey
ALTER TABLE "rubric" DROP CONSTRAINT "rubric_criteriaId_fkey";

-- DropForeignKey
ALTER TABLE "winner" DROP CONSTRAINT "winner_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "winner" DROP CONSTRAINT "winner_projectId_fkey";

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballot" ADD CONSTRAINT "ballot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballot" ADD CONSTRAINT "ballot_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballot" ADD CONSTRAINT "ballot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric" ADD CONSTRAINT "rubric_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winner" ADD CONSTRAINT "winner_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winner" ADD CONSTRAINT "winner_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "user.email_unique" RENAME TO "user_email_key";

-- RenameIndex
ALTER INDEX "user.userId_unique" RENAME TO "user_userId_key";
