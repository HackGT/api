/*
  Warnings:

  - You are about to drop the column `uuid` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "user.uuid_unique";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "uuid",
DROP COLUMN "token",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "session";

-- CreateIndex
CREATE UNIQUE INDEX "user.userId_unique" ON "user"("userId");
