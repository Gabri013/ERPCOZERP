-- Funil comercial + versionamento de orçamentos + atividades
CREATE TABLE "sales_opportunities" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "owner_user_id" UUID,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "profile_abc" TEXT,
    "project_type" TEXT,
    "potential" TEXT,
    "scope_notes" TEXT,
    "delivery_notes" TEXT,
    "lost_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sales_opportunities_number_key" ON "sales_opportunities"("number");
CREATE INDEX "idx_opportunities_customer" ON "sales_opportunities"("customer_id");
CREATE INDEX "idx_opportunities_owner" ON "sales_opportunities"("owner_user_id");
CREATE INDEX "idx_opportunities_status" ON "sales_opportunities"("status");

ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "sales_activities" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID,
    "quote_id" UUID,
    "user_id" UUID,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_sales_act_opp" ON "sales_activities"("opportunity_id");
CREATE INDEX "idx_sales_act_quote" ON "sales_activities"("quote_id");
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Quotes: novas colunas (family_id obrigatório após backfill)
ALTER TABLE "quotes" ADD COLUMN "opportunity_id" UUID;
ALTER TABLE "quotes" ADD COLUMN "family_id" UUID;
ALTER TABLE "quotes" ADD COLUMN "version_number" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "quotes" ADD COLUMN "locked_at" TIMESTAMP(3);
ALTER TABLE "quotes" ADD COLUMN "technical_review" TEXT NOT NULL DEFAULT 'NOT_REQUIRED';

UPDATE "quotes" SET "family_id" = "id" WHERE "family_id" IS NULL;
ALTER TABLE "quotes" ALTER COLUMN "family_id" SET NOT NULL;

CREATE INDEX "idx_quotes_opportunity" ON "quotes"("opportunity_id");
CREATE INDEX "idx_quotes_family" ON "quotes"("family_id");

ALTER TABLE "quotes" ADD CONSTRAINT "quotes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
