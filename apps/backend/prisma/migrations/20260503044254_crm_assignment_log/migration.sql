-- AlterTable
ALTER TABLE "account_entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "account_plan" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_process_attachments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_process_notes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_processes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "expedition_loads" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "expedition_manifests" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "expedition_orders" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_articles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_attachments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_categories" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_revisions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_standard_costs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_cost_entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_notes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_tasks" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_time_entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quality_databook_documents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quality_databooks" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quality_documents" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quality_inspection_plans" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quality_inspections" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quality_instruments" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quality_nonconformities" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sale_orders" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "crm_assignment_logs" (
    "id" UUID NOT NULL,
    "entity_code" TEXT NOT NULL,
    "entity_record_id" UUID NOT NULL,
    "antigo_responsavel" TEXT,
    "novo_responsavel" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_assignment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_crm_assignment_record" ON "crm_assignment_logs"("entity_record_id");

-- CreateIndex
CREATE INDEX "idx_crm_assignment_entity_created" ON "crm_assignment_logs"("entity_code", "created_at");

-- RenameIndex
ALTER INDEX "payroll_runs_reference_month_key" RENAME TO "uq_payroll_run_month";
