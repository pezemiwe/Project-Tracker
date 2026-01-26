-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'ProjectManager', 'Finance', 'CommitteeMember', 'Auditor', 'Viewer');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('Planned', 'InProgress', 'OnHold', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "ApprovalState" AS ENUM ('Draft', 'Submitted', 'FinanceApproved', 'CommitteeApproved', 'Rejected');

-- CreateEnum
CREATE TYPE "ApprovalTargetType" AS ENUM ('EstimateChange', 'ActualEntry', 'StatusChange');

-- CreateEnum
CREATE TYPE "ActualType" AS ENUM ('Committed', 'Disbursed', 'Spent');

-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('Proposal', 'Invoice', 'Report', 'Photo', 'Other');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('Create', 'Update', 'Delete', 'SoftDelete', 'Restore', 'Reopen', 'Approve', 'Reject', 'Import');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_objectives" (
    "id" TEXT NOT NULL,
    "sn" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "short_description" TEXT,
    "long_description" TEXT,
    "region" TEXT,
    "tags" TEXT[],
    "overall_start_year" INTEGER NOT NULL,
    "overall_end_year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "computed_estimated_spend_usd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "investment_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "investment_objective_id" TEXT NOT NULL,
    "sn" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description_and_objective" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'Planned',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "lead" TEXT,
    "estimated_spend_usd_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "annual_estimates" JSONB NOT NULL DEFAULT '{}',
    "risk_rating" TEXT,
    "priority" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actuals" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount_usd" DECIMAL(15,2) NOT NULL,
    "type" "ActualType" NOT NULL,
    "description" TEXT,
    "recorded_by" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "target_type" "ApprovalTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "current_state" "ApprovalState" NOT NULL DEFAULT 'Draft',
    "submitted_by" TEXT,
    "submitted_at" TIMESTAMP(3),
    "finance_approved_by" TEXT,
    "finance_approved_at" TIMESTAMP(3),
    "finance_comment" TEXT,
    "committee_approved_by" TEXT,
    "committee_approved_at" TIMESTAMP(3),
    "committee_comment" TEXT,
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "parent_type" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "category" "AttachmentCategory" NOT NULL,
    "description" TEXT,
    "storage_path" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "virus_scan_status" TEXT NOT NULL DEFAULT 'Pending',
    "virus_scan_at" TIMESTAMP(3),
    "uploader_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" "UserRole",
    "action" "AuditAction" NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_values" JSONB,
    "new_values" JSONB,
    "comment" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_email_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_approval_submitted" BOOLEAN NOT NULL DEFAULT true,
    "email_approval_decision" BOOLEAN NOT NULL DEFAULT true,
    "email_variance_alert" BOOLEAN NOT NULL DEFAULT true,
    "email_import_complete" BOOLEAN NOT NULL DEFAULT true,
    "inapp_approval_submitted" BOOLEAN NOT NULL DEFAULT true,
    "inapp_approval_decision" BOOLEAN NOT NULL DEFAULT true,
    "inapp_variance_alert" BOOLEAN NOT NULL DEFAULT true,
    "inapp_import_complete" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "investment_objectives_sn_idx" ON "investment_objectives"("sn");

-- CreateIndex
CREATE INDEX "investment_objectives_status_deleted_at_idx" ON "investment_objectives"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "investment_objectives_region_deleted_at_idx" ON "investment_objectives"("region", "deleted_at");

-- CreateIndex
CREATE INDEX "investment_objectives_overall_start_year_overall_end_year_idx" ON "investment_objectives"("overall_start_year", "overall_end_year");

-- CreateIndex
CREATE INDEX "investment_objectives_deleted_at_idx" ON "investment_objectives"("deleted_at");

-- CreateIndex
CREATE INDEX "activities_investment_objective_id_deleted_at_idx" ON "activities"("investment_objective_id", "deleted_at");

-- CreateIndex
CREATE INDEX "activities_status_deleted_at_idx" ON "activities"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "activities_lead_deleted_at_idx" ON "activities"("lead", "deleted_at");

-- CreateIndex
CREATE INDEX "activities_start_date_end_date_idx" ON "activities"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "activities_locked_by_locked_at_idx" ON "activities"("locked_by", "locked_at");

-- CreateIndex
CREATE INDEX "actuals_activity_id_deleted_at_idx" ON "actuals"("activity_id", "deleted_at");

-- CreateIndex
CREATE INDEX "actuals_date_idx" ON "actuals"("date");

-- CreateIndex
CREATE INDEX "actuals_type_idx" ON "actuals"("type");

-- CreateIndex
CREATE INDEX "approvals_target_type_target_id_idx" ON "approvals"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "approvals_current_state_idx" ON "approvals"("current_state");

-- CreateIndex
CREATE INDEX "approvals_submitted_by_submitted_at_idx" ON "approvals"("submitted_by", "submitted_at");

-- CreateIndex
CREATE INDEX "attachments_parent_type_parent_id_deleted_at_idx" ON "attachments"("parent_type", "parent_id", "deleted_at");

-- CreateIndex
CREATE INDEX "attachments_category_idx" ON "attachments"("category");

-- CreateIndex
CREATE INDEX "attachments_virus_scan_status_idx" ON "attachments"("virus_scan_status");

-- CreateIndex
CREATE INDEX "audit_logs_object_type_object_id_idx" ON "audit_logs"("object_type", "object_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "investment_objectives" ADD CONSTRAINT "investment_objectives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_objectives" ADD CONSTRAINT "investment_objectives_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_investment_objective_id_fkey" FOREIGN KEY ("investment_objective_id") REFERENCES "investment_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuals" ADD CONSTRAINT "actuals_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuals" ADD CONSTRAINT "actuals_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_finance_approved_by_fkey" FOREIGN KEY ("finance_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_committee_approved_by_fkey" FOREIGN KEY ("committee_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
