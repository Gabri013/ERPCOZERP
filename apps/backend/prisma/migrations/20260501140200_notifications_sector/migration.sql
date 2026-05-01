-- AlterTable
ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "sector" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_notifications_user_sector" ON "user_notifications"("user_id", "sector");

