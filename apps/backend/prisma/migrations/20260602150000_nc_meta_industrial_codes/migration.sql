-- Categorias industriais (cores) + regras de código + sequências atómicas

CREATE TABLE "nc_meta_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "label" VARCHAR(128) NOT NULL,
    "color" VARCHAR(16) NOT NULL,
    "text_color" VARCHAR(16) NOT NULL,
    "icon" VARCHAR(64),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nc_meta_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nc_meta_categories_code_key" ON "nc_meta_categories"("code");
CREATE INDEX "idx_nc_meta_categories_active" ON "nc_meta_categories"("active", "sort_order");

CREATE TABLE "nc_meta_code_rules" (
    "id" UUID NOT NULL,
    "entity" VARCHAR(64) NOT NULL,
    "prefix" VARCHAR(16) NOT NULL,
    "categoria_field" VARCHAR(64),
    "use_year" BOOLEAN NOT NULL DEFAULT true,
    "use_month" BOOLEAN NOT NULL DEFAULT true,
    "sequence_padding" INTEGER NOT NULL DEFAULT 5,
    "reset_type" VARCHAR(16) NOT NULL DEFAULT 'month',
    "format" VARCHAR(32) NOT NULL DEFAULT 'PREFIX_CAT_YM_SEQ',
    "target_field" VARCHAR(32) NOT NULL DEFAULT 'numero',
    "fallback_category_code" VARCHAR(16) NOT NULL DEFAULT 'MOB',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nc_meta_code_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nc_meta_code_rules_entity_key" ON "nc_meta_code_rules"("entity");

CREATE TABLE "nc_meta_code_sequences" (
    "id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "period_key" VARCHAR(32) NOT NULL,
    "category_key" VARCHAR(32) NOT NULL,
    "last_value" INTEGER NOT NULL,

    CONSTRAINT "nc_meta_code_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_nc_meta_code_sequence" ON "nc_meta_code_sequences"("rule_id", "period_key", "category_key");

ALTER TABLE "nc_meta_code_sequences" ADD CONSTRAINT "nc_meta_code_sequences_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "nc_meta_code_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "work_orders" ADD COLUMN "category_code" VARCHAR(16);
ALTER TABLE "work_orders" ADD COLUMN "category_label" VARCHAR(128);

INSERT INTO "nc_meta_categories" ("id", "code", "label", "color", "text_color", "icon", "sort_order", "active", "created_at", "updated_at")
SELECT gen_random_uuid(), v.code, v.label, v.color, v.text_color, NULL, v.sort_order, true, NOW(), NOW()
FROM (VALUES
  ('COC', 'Cocção', '#FACC15', '#422006', 10),
  ('REF', 'Refrigeração', '#3B82F6', '#FFFFFF', 20),
  ('MOB', 'Mobiliário', '#22C55E', '#052E16', 30),
  ('ENG', 'Engenharia', '#6366F1', '#FFFFFF', 40),
  ('TUB', 'Tubo', '#94A3B8', '#0F172A', 50),
  ('SOL', 'Solda', '#F97316', '#431407', 60),
  ('URG', 'Urgente', '#EC4899', '#FFFFFF', 5)
) AS v(code, label, color, text_color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "nc_meta_categories" c WHERE c.code = v.code);

INSERT INTO "nc_meta_code_rules" (
  "id", "entity", "prefix", "categoria_field", "use_year", "use_month", "sequence_padding",
  "reset_type", "format", "target_field", "fallback_category_code", "active", "created_at", "updated_at"
)
SELECT gen_random_uuid(), r.entity, r.prefix, r.categoria_field, r.use_year, r.use_month, r.sequence_padding,
  r.reset_type, r.format, r.target_field, r.fallback_category_code, true, NOW(), NOW()
FROM (VALUES
  ('produto', 'PRD', 'categoria_industrial', true, true, 5, 'month', 'CAT_PREFIX_YM_SEQ', 'codigo', 'MOB'),
  ('ordem_producao', 'OP', 'categoria_codigo', true, true, 5, 'month', 'PREFIX_CAT_YM_SEQ', 'numero', 'MOB'),
  ('pedido_venda', 'PED', NULL::varchar, true, false, 6, 'year', 'PREFIX_YEAR_SEQ', 'numero', 'MOB'),
  ('work_order', 'OP', 'group', true, true, 5, 'month', 'PREFIX_CAT_YM_SEQ', 'number', 'MOB')
) AS r(entity, prefix, categoria_field, use_year, use_month, sequence_padding, reset_type, format, target_field, fallback_category_code)
WHERE NOT EXISTS (SELECT 1 FROM "nc_meta_code_rules" x WHERE x.entity = r.entity);
