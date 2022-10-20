/*
  Warnings:

  - Added the required column `tableSize` to the `table_group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "table_group" ADD COLUMN     "tableSize" INTEGER NOT NULL;
