/*
  Warnings:

  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sess` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `expire` on the `sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sid]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
DROP COLUMN "sess",
DROP COLUMN "expire",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "data" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "sid" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions.sid_unique" ON "sessions"("sid");
