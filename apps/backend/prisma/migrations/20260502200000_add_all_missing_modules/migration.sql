-- CreateTable: crm_processes
CREATE TABLE "crm_processes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "responsible" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'Aberto',
    "value" DECIMAL(14,2),
    "probability" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "origin" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forecast_at" TIMESTAMP(3),
    "linked_order_id" TEXT,
    "custom_fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_processes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_crm_processes_type" ON "crm_processes"("type");
CREATE INDEX "idx_crm_processes_stage" ON "crm_processes"("stage");

-- CreateTable: crm_process_notes
CREATE TABLE "crm_process_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "process_id" UUID NOT NULL,
    "user_name" TEXT,
    "note_type" TEXT NOT NULL DEFAULT 'nota',
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_process_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_crm_notes_process" ON "crm_process_notes"("process_id");
ALTER TABLE "crm_process_notes" ADD CONSTRAINT "crm_process_notes_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "crm_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: crm_process_attachments
CREATE TABLE "crm_process_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "process_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" TEXT,
    "file_type" TEXT,
    "path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_process_attachments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_crm_attach_process" ON "crm_process_attachments"("process_id");
ALTER TABLE "crm_process_attachments" ADD CONSTRAINT "crm_process_attachments_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "crm_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: projects
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "linked_order_id" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planejamento',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(14,2),
    "budgeted_cost" DECIMAL(14,2),
    "responsible" TEXT,
    "description" TEXT,
    "team" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");
CREATE INDEX "idx_projects_status" ON "projects"("status");

-- CreateTable: project_tasks
CREATE TABLE "project_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL DEFAULT 1,
    "start_offset" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "responsible" TEXT,
    "predecessor" INTEGER,
    "hours_planned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "hours_real" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_project_tasks_project" ON "project_tasks"("project_id");
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: project_time_entries
CREATE TABLE "project_time_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "task_id" UUID,
    "person_name" TEXT NOT NULL,
    "work_date" DATE NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_time_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_proj_time_project" ON "project_time_entries"("project_id");
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: project_cost_entries
CREATE TABLE "project_cost_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_cost_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_proj_costs_project" ON "project_cost_entries"("project_id");
ALTER TABLE "project_cost_entries" ADD CONSTRAINT "project_cost_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: project_notes
CREATE TABLE "project_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_name" TEXT NOT NULL,
    "note_type" TEXT NOT NULL DEFAULT 'nota',
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_proj_notes_project" ON "project_notes"("project_id");
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: knowledge_categories
CREATE TABLE "knowledge_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: knowledge_articles
CREATE TABLE "knowledge_articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "visibility" TEXT NOT NULL DEFAULT 'interno',
    "subcategory" TEXT,
    "author" TEXT,
    "tags" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "knowledge_articles_slug_key" ON "knowledge_articles"("slug");
CREATE INDEX "idx_kb_articles_cat" ON "knowledge_articles"("category_id");
CREATE INDEX "idx_kb_articles_status" ON "knowledge_articles"("status");
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "knowledge_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: knowledge_revisions
CREATE TABLE "knowledge_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_revisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_kb_revisions_art" ON "knowledge_revisions"("article_id");
ALTER TABLE "knowledge_revisions" ADD CONSTRAINT "knowledge_revisions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: knowledge_attachments
CREATE TABLE "knowledge_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" TEXT,
    "path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_attachments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_kb_attach_art" ON "knowledge_attachments"("article_id");
ALTER TABLE "knowledge_attachments" ADD CONSTRAINT "knowledge_attachments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: quality_inspection_plans
CREATE TABLE "quality_inspection_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_code" TEXT,
    "stage" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "criteria" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_inspection_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quality_inspection_plans_code_key" ON "quality_inspection_plans"("code");

-- CreateTable: quality_inspections
CREATE TABLE "quality_inspections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "product_code" TEXT,
    "product_name" TEXT,
    "reference_doc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aprovado',
    "inspector" TEXT,
    "inspected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "results" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quality_inspections_code_key" ON "quality_inspections"("code");
CREATE INDEX "idx_quality_insp_type" ON "quality_inspections"("type");
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "quality_inspection_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: quality_nonconformities
CREATE TABLE "quality_nonconformities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'Moderada',
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "responsible" TEXT,
    "due_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_nonconformities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quality_nonconformities_code_key" ON "quality_nonconformities"("code");
CREATE INDEX "idx_quality_nc_status" ON "quality_nonconformities"("status");

-- CreateTable: quality_instruments
CREATE TABLE "quality_instruments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instrument_type" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'calibrado',
    "last_calibration" TIMESTAMP(3),
    "next_calibration" TIMESTAMP(3),
    "calibration_interval" INTEGER NOT NULL DEFAULT 180,
    "responsible" TEXT,
    "certificate" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_instruments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quality_instruments_code_key" ON "quality_instruments"("code");

-- CreateTable: quality_documents
CREATE TABLE "quality_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "document_type" TEXT,
    "product_code" TEXT,
    "order_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "content" JSONB,
    "signatures" JSONB,
    "author" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quality_documents_code_key" ON "quality_documents"("code");
CREATE INDEX "idx_quality_docs_type" ON "quality_documents"("document_type");

-- CreateTable: quality_databooks
CREATE TABLE "quality_databooks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order_ref" TEXT,
    "product_code" TEXT,
    "client_name" TEXT,
    "template" TEXT,
    "status" TEXT NOT NULL DEFAULT 'em_elaboracao',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_databooks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quality_databooks_code_key" ON "quality_databooks"("code");

-- CreateTable: quality_databook_documents
CREATE TABLE "quality_databook_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "databook_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "doc_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_databook_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_databook_docs" ON "quality_databook_documents"("databook_id");
ALTER TABLE "quality_databook_documents" ADD CONSTRAINT "quality_databook_documents_databook_id_fkey" FOREIGN KEY ("databook_id") REFERENCES "quality_databooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: expedition_orders
CREATE TABLE "expedition_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "sale_order_id" TEXT,
    "client_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando_separacao',
    "scheduled_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "carrier" TEXT,
    "notes" TEXT,
    "items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expedition_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expedition_orders_code_key" ON "expedition_orders"("code");
CREATE INDEX "idx_expedition_status" ON "expedition_orders"("status");

-- CreateTable: expedition_loads
CREATE TABLE "expedition_loads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "load_type" TEXT NOT NULL DEFAULT 'caixa',
    "description" TEXT,
    "weight" DECIMAL(10,3),
    "items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expedition_loads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expedition_loads_code_key" ON "expedition_loads"("code");
CREATE INDEX "idx_exp_loads_order" ON "expedition_loads"("order_id");
ALTER TABLE "expedition_loads" ADD CONSTRAINT "expedition_loads_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "expedition_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: expedition_manifests
CREATE TABLE "expedition_manifests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "nfe_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "carrier" TEXT,
    "driver_name" TEXT,
    "vehicle_plate" TEXT,
    "loads" JSONB,
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expedition_manifests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expedition_manifests_code_key" ON "expedition_manifests"("code");
CREATE INDEX "idx_exp_manifests_order" ON "expedition_manifests"("order_id");
ALTER TABLE "expedition_manifests" ADD CONSTRAINT "expedition_manifests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "expedition_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: account_plan
CREATE TABLE "account_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "parent_code" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "account_plan_code_key" ON "account_plan"("code");

-- CreateTable: account_entries
CREATE TABLE "account_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "debit_account" TEXT NOT NULL,
    "credit_account" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL',
    "module" TEXT,
    "reference_id" TEXT,
    "history" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_account_entries_date" ON "account_entries"("entry_date");
CREATE INDEX "idx_account_entries_module" ON "account_entries"("module");

-- CreateTable: product_standard_costs
CREATE TABLE "product_standard_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "material_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "labor_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "overhead_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "sale_price" DECIMAL(14,4),
    "margin_pct" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_standard_costs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_standard_costs_product_id_key" ON "product_standard_costs"("product_id");
