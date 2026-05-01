-- AlterTable
ALTER TABLE "users" ADD COLUMN "legacy_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "users_legacy_id_key" ON "users"("legacy_id");
