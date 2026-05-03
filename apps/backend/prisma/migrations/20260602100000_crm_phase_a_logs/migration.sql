-- Fase A CRM: auditoria de eventos
CREATE TABLE "crm_logs" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_code" TEXT NOT NULL,
    "entity_record_id" UUID NOT NULL,
    "user_id" UUID,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_crm_logs_entity_record" ON "crm_logs"("entity_code", "entity_record_id");
CREATE INDEX "idx_crm_logs_created" ON "crm_logs"("created_at");

ALTER TABLE "crm_logs" ADD CONSTRAINT "crm_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
