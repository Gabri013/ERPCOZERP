-- Responsável comercial por pedido de venda (escopo "minhas vendas").
-- Deve rodar após a tabela sale_orders existir (nº anterior à pasta 20260203 mal ordenada).
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "owner_user_id" UUID;
CREATE INDEX IF NOT EXISTS "idx_sale_orders_owner" ON "sale_orders"("owner_user_id");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_owner_user_id_fkey'
  ) THEN
    ALTER TABLE "sale_orders"
      ADD CONSTRAINT "sale_orders_owner_user_id_fkey"
      FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
