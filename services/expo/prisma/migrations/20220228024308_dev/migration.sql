/*
  Warnings:

  - You are about to drop the column `tableSize` on the `table_group` table. All the data in the column will be lost.
  - Added the required column `tableCapacity` to the `table_group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "table_group" DROP COLUMN "tableSize",
ADD COLUMN     "tableCapacity" INTEGER NOT NULL;
