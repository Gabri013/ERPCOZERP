-- No-code metadata engine (forms, layouts, workflows, theme tokens)

CREATE TABLE "nc_meta_configs" (
    "id" UUID NOT NULL,
    "scope" VARCHAR(256) NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "value" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nc_meta_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nc_meta_configs_scope_key_key" ON "nc_meta_configs"("scope", "key");

CREATE TABLE "nc_meta_fields" (
    "id" UUID NOT NULL,
    "entity_code" VARCHAR(128) NOT NULL,
    "field_code" VARCHAR(128) NOT NULL,
    "label" VARCHAR(256) NOT NULL,
    "data_type" VARCHAR(32) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nc_meta_fields_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nc_meta_fields_entity_field_key" ON "nc_meta_fields"("entity_code", "field_code");
CREATE INDEX "idx_nc_meta_fields_entity" ON "nc_meta_fields"("entity_code", "active", "sort_order");

CREATE TABLE "nc_meta_layouts" (
    "id" UUID NOT NULL,
    "entity_code" VARCHAR(128),
    "scope" VARCHAR(64) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "layout" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nc_meta_layouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_nc_meta_layouts_entity_scope" ON "nc_meta_layouts"("entity_code", "scope");

CREATE TABLE "nc_meta_workflows" (
    "id" UUID NOT NULL,
    "code" VARCHAR(128) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "entity_code" VARCHAR(128),
    "definition" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nc_meta_workflows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nc_meta_workflows_code_key" ON "nc_meta_workflows"("code");

CREATE TABLE "nc_meta_themes" (
    "id" UUID NOT NULL,
    "token_key" VARCHAR(128) NOT NULL,
    "value" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nc_meta_themes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nc_meta_themes_token_key_key" ON "nc_meta_themes"("token_key");
