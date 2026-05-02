-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('RASCUNHO', 'PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routings" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_stages" (
    "id" UUID NOT NULL,
    "routing_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "machine_id" UUID,
    "duration_minutes" INTEGER,

    CONSTRAINT "routing_stages_pkey" PRIMARY KEY ("id")
);

-- AlterTable work_orders: remove unique on sale_order_id, add columns
DROP INDEX IF EXISTS "work_orders_sale_order_id_key";

CREATE INDEX "idx_work_orders_sale_order" ON "work_orders"("sale_order_id");

ALTER TABLE "work_orders" ADD COLUMN "product_id" UUID,
ADD COLUMN "routing_id" UUID,
ADD COLUMN "quantity_planned" DECIMAL(14,4) NOT NULL DEFAULT 1,
ADD COLUMN "scheduled_start" TIMESTAMP(3),
ADD COLUMN "scheduled_end" TIMESTAMP(3),
ADD COLUMN "due_date" TIMESTAMP(3),
ADD COLUMN "kanban_column" TEXT NOT NULL DEFAULT 'BACKLOG',
ADD COLUMN "kanban_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN "notes" TEXT,
ADD COLUMN "responsible_user_id" UUID,
ADD COLUMN "finished_at" TIMESTAMP(3),
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "work_order_status_history" (
    "id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_appointments" (
    "id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "machine_id" UUID,
    "routing_stage_id" UUID,
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable HR
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "department" TEXT,
    "hire_date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "salary_base" DECIMAL(14,2),
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "time_entries" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "work_date" DATE NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDENTE',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL,
    "reference_month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "calculated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_lines" (
    "id" UUID NOT NULL,
    "payroll_run_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "gross" DECIMAL(14,2) NOT NULL,
    "inss" DECIMAL(14,2) NOT NULL,
    "irrf" DECIMAL(14,2) NOT NULL,
    "net" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "payroll_lines_pkey" PRIMARY KEY ("id")
);

-- Fiscal
CREATE TABLE "fiscal_nfes" (
    "id" UUID NOT NULL,
    "number" TEXT,
    "series" TEXT,
    "access_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "customer_name" TEXT,
    "total_amount" DECIMAL(14,2),
    "issued_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "xml_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_nfes_pkey" PRIMARY KEY ("id")
);

-- Engineering
CREATE TABLE "product_files" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_files_pkey" PRIMARY KEY ("id")
);

-- Products / notifications extras
ALTER TABLE "products" ADD COLUMN "model3d_path" TEXT;

ALTER TABLE "user_notifications" ADD COLUMN "target_roles" JSONB;
ALTER TABLE "user_notifications" ADD COLUMN "target_module" TEXT;

-- Unique indexes
CREATE UNIQUE INDEX "machines_code_key" ON "machines"("code");
CREATE UNIQUE INDEX "routings_code_key" ON "routings"("code");
CREATE UNIQUE INDEX "employees_code_key" ON "employees"("code");
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");
CREATE UNIQUE INDEX "payroll_runs_reference_month_key" ON "payroll_runs"("reference_month");
CREATE UNIQUE INDEX "uq_payroll_line_run_emp" ON "payroll_lines"("payroll_run_id", "employee_id");
CREATE UNIQUE INDEX "fiscal_nfes_access_key_key" ON "fiscal_nfes"("access_key");

-- Indexes
CREATE INDEX "idx_routing_stages_routing" ON "routing_stages"("routing_id");
CREATE INDEX "idx_wo_status_hist_wo" ON "work_order_status_history"("work_order_id");
CREATE INDEX "idx_prod_appt_wo" ON "production_appointments"("work_order_id");
CREATE INDEX "idx_prod_appt_start" ON "production_appointments"("scheduled_start");
CREATE INDEX "idx_work_orders_status" ON "work_orders"("status");
CREATE INDEX "idx_work_orders_kanban_col" ON "work_orders"("kanban_column");
CREATE INDEX "idx_time_entries_emp_date" ON "time_entries"("employee_id", "work_date");
CREATE INDEX "idx_leave_req_emp" ON "leave_requests"("employee_id");
CREATE INDEX "idx_fiscal_nfe_status" ON "fiscal_nfes"("status");
CREATE INDEX "idx_product_files_product" ON "product_files"("product_id");

-- Foreign keys machines / routings
ALTER TABLE "routings" ADD CONSTRAINT "routings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "routing_stages" ADD CONSTRAINT "routing_stages_routing_id_fkey" FOREIGN KEY ("routing_id") REFERENCES "routings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "routing_stages" ADD CONSTRAINT "routing_stages_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- work_orders FKs
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_routing_id_fkey" FOREIGN KEY ("routing_id") REFERENCES "routings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "production_appointments" ADD CONSTRAINT "production_appointments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_appointments" ADD CONSTRAINT "production_appointments_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "production_appointments" ADD CONSTRAINT "production_appointments_routing_stage_id_fkey" FOREIGN KEY ("routing_stage_id") REFERENCES "routing_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- HR FKs
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_files" ADD CONSTRAINT "product_files_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
