/*
  Warnings:

  - Added the required column `hackathonId` to the `table_group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "table_group" ADD COLUMN     "hackathonId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "table_group" ADD FOREIGN KEY ("hackathonId") REFERENCES "hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
