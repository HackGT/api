/*
  Warnings:

  - You are about to drop the `_UserToWinner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserToWinner" DROP CONSTRAINT "_UserToWinner_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserToWinner" DROP CONSTRAINT "_UserToWinner_B_fkey";

-- DropTable
DROP TABLE "_UserToWinner";
