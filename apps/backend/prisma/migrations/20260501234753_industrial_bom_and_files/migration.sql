-- CreateTable
CREATE TABLE "product_industrial_meta" (
    "entity_record_id" UUID NOT NULL,
    "bom_status" TEXT NOT NULL DEFAULT 'EMPTY',
    "model3d_path" TEXT,
    "model3d_original_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_industrial_meta_pkey" PRIMARY KEY ("entity_record_id")
);

-- CreateTable
CREATE TABLE "bill_of_material_lines" (
    "id" UUID NOT NULL,
    "product_record_id" UUID NOT NULL,
    "line_order" INTEGER NOT NULL DEFAULT 0,
    "component_code" TEXT NOT NULL,
    "description" TEXT,
    "material_spec" TEXT,
    "x_mm" DOUBLE PRECISION,
    "y_mm" DOUBLE PRECISION,
    "thickness_mm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_of_material_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "material_code" TEXT,
    "dimensions_x" DOUBLE PRECISION,
    "dimensions_y" DOUBLE PRECISION,
    "thickness" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "supplier_default" TEXT NOT NULL DEFAULT 'A definir',
    "linked_entity_record_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_files" (
    "id" UUID NOT NULL,
    "product_record_id" UUID,
    "op_record_id" UUID,
    "tipo" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "caminho_arquivo" TEXT NOT NULL,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_bom_lines_product" ON "bill_of_material_lines"("product_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_code_key" ON "raw_materials"("code");

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_linked_entity_record_id_key" ON "raw_materials"("linked_entity_record_id");

-- CreateIndex
CREATE INDEX "idx_technical_files_product" ON "technical_files"("product_record_id");

-- CreateIndex
CREATE INDEX "idx_technical_files_op" ON "technical_files"("op_record_id");

-- AddForeignKey
ALTER TABLE "product_industrial_meta" ADD CONSTRAINT "product_industrial_meta_entity_record_id_fkey" FOREIGN KEY ("entity_record_id") REFERENCES "entity_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material_lines" ADD CONSTRAINT "bill_of_material_lines_product_record_id_fkey" FOREIGN KEY ("product_record_id") REFERENCES "entity_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
