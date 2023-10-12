/*
  Warnings:

  - You are about to drop the column `categoryGroupId` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_categoryGroupId_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "categoryGroupId";

-- CreateTable
CREATE TABLE "_CategoryGroupToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryGroupToUser_AB_unique" ON "_CategoryGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryGroupToUser_B_index" ON "_CategoryGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "_CategoryGroupToUser" ADD CONSTRAINT "_CategoryGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "category_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGroupToUser" ADD CONSTRAINT "_CategoryGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
