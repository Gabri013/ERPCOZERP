-- Migration: add process + total_qty columns to bill_of_material_lines
-- and materialType to raw_materials

ALTER TABLE "bill_of_material_lines"
  ADD COLUMN IF NOT EXISTS "process" TEXT,
  ADD COLUMN IF NOT EXISTS "total_qty" DOUBLE PRECISION;
