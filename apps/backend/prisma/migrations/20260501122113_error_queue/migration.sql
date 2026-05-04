-- Fila de erros: monitorização contínua, análise (IA) e workflow (sem alteração de código em runtime).

CREATE TABLE "error_queue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "description" TEXT NOT NULL,
    "source_file" VARCHAR(512),
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "route" VARCHAR(512),
    "user_id" UUID,
    "stack_trace" TEXT,
    "http_method" VARCHAR(16),
    "http_status" INTEGER,
    "metadata" JSONB,
    "analysis_json" JSONB,
    "probable_cause" TEXT,
    "suggested_fix" TEXT,
    "impact" TEXT,
    "auto_fix_eligible" BOOLEAN NOT NULL DEFAULT false,
    "auto_applied" BOOLEAN NOT NULL DEFAULT false,
    "test_result" JSONB,
    "rollback_at" TIMESTAMPTZ(6),
    "event_log" JSONB NOT NULL DEFAULT '[]',
    "pull_request_url" VARCHAR(512),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_error_queue_status_created" ON "error_queue"("status", "created_at");
CREATE INDEX "idx_error_queue_severity_created" ON "error_queue"("severity", "created_at");

ALTER TABLE "error_queue" ADD CONSTRAINT "error_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;