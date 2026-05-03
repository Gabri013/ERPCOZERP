-- CRM Fase D: histórico de estágios para analytics.

CREATE TABLE "crm_stage_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "oportunidade_id" UUID NOT NULL,
    "stage_from" VARCHAR(64) NOT NULL,
    "stage_to" VARCHAR(64) NOT NULL,
    "usuario_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_stage_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_crm_stage_hist_opp_created" ON "crm_stage_history"("oportunidade_id", "created_at");

CREATE INDEX "idx_crm_stage_hist_created" ON "crm_stage_history"("created_at");
