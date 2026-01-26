/*
  Warnings:

  - You are about to drop the column `date` on the `actuals` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_at` on the `actuals` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_by` on the `actuals` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `actuals` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `file_size_bytes` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `original_filename` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `parent_id` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `parent_type` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `storage_path` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `uploader_id` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `virus_scan_at` on the `attachments` table. All the data in the column will be lost.
  - You are about to alter the column `mime_type` on the `attachments` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - Added the required column `category` to the `actuals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `actuals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entry_date` to the `actuals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `actuals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_name` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_size` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_file_name` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storage_key` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaded_by` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "actuals" DROP CONSTRAINT "actuals_recorded_by_fkey";

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_uploader_id_fkey";

-- DropIndex
DROP INDEX "actuals_date_idx";

-- DropIndex
DROP INDEX "actuals_type_idx";

-- DropIndex
DROP INDEX "attachments_category_idx";

-- DropIndex
DROP INDEX "attachments_parent_type_parent_id_deleted_at_idx";

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "actual_spend_usd_total" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "actuals" DROP COLUMN "date",
DROP COLUMN "recorded_at",
DROP COLUMN "recorded_by",
DROP COLUMN "type",
ADD COLUMN     "category" VARCHAR(100) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "entry_date" DATE NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "file_size_bytes",
DROP COLUMN "filename",
DROP COLUMN "original_filename",
DROP COLUMN "parent_id",
DROP COLUMN "parent_type",
DROP COLUMN "storage_path",
DROP COLUMN "uploader_id",
DROP COLUMN "version",
DROP COLUMN "virus_scan_at",
ADD COLUMN     "actual_id" TEXT,
ADD COLUMN     "file_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "file_size" INTEGER NOT NULL,
ADD COLUMN     "original_file_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "storage_key" VARCHAR(500) NOT NULL,
ADD COLUMN     "uploaded_by" TEXT NOT NULL,
ADD COLUMN     "virus_scan_result" TEXT,
ALTER COLUMN "mime_type" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE INDEX "actuals_entry_date_idx" ON "actuals"("entry_date");

-- CreateIndex
CREATE INDEX "actuals_category_idx" ON "actuals"("category");

-- CreateIndex
CREATE INDEX "attachments_actual_id_deleted_at_idx" ON "attachments"("actual_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "actuals" ADD CONSTRAINT "actuals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuals" ADD CONSTRAINT "actuals_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_actual_id_fkey" FOREIGN KEY ("actual_id") REFERENCES "actuals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
