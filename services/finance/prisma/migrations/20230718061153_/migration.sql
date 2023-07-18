/*
  Warnings:

  - The primary key for the `file` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `googleName` on the `file` table. All the data in the column will be lost.
  - You are about to drop the column `mimetype` on the `file` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `file` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "file_googleName_key";

-- AlterTable
ALTER TABLE "file" DROP CONSTRAINT "file_pkey",
DROP COLUMN "googleName",
DROP COLUMN "mimetype",
DROP COLUMN "name",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "file_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "file_id_seq";
