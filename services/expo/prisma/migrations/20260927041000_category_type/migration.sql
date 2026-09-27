-- CreateEnum
CREATE TYPE "category_type" AS ENUM ('general', 'sponsor', 'other', 'autoConsider');

-- AlterTable
ALTER TABLE "category" ADD COLUMN "type" "category_type";

UPDATE "category" SET "type" = 'other' WHERE "type" IS NULL;

ALTER TABLE "category" ALTER COLUMN "type" SET NOT NULL;
