/*
  Warnings:

  - You are about to drop the column `region` on the `investment_objectives` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "investment_objectives_region_deleted_at_idx";

-- AlterTable
ALTER TABLE "investment_objectives" DROP COLUMN "region",
ADD COLUMN     "regions" TEXT[],
ADD COLUMN     "states" TEXT[];

-- CreateIndex
CREATE INDEX "investment_objectives_regions_deleted_at_idx" ON "investment_objectives"("regions", "deleted_at");
