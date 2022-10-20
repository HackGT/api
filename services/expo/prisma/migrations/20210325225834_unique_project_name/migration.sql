/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[name]` on the table `project`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "project.name_unique" ON "project"("name");
