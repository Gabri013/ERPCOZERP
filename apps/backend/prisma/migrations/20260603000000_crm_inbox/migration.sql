-- CRM Fase C: Inbox (conversas + mensagens), sem EntityRecord.

CREATE TABLE "crm_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channel" VARCHAR(32) NOT NULL,
    "contato_nome" TEXT NOT NULL,
    "contato_telefone" TEXT NOT NULL,
    "contato_id" UUID,
    "lead_id" UUID,
    "opportunity_id" UUID,
    "responsavel_id" UUID,
    "status" VARCHAR(32) NOT NULL DEFAULT 'novo',
    "last_inbound_at" TIMESTAMP(3),
    "last_outbound_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3),
    "last_message_preview" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "direction" VARCHAR(16) NOT NULL,
    "message" TEXT NOT NULL,
    "message_type" VARCHAR(32) NOT NULL DEFAULT 'text',
    "external_id" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_crm_conversation_channel_phone" ON "crm_conversations"("channel", "contato_telefone");

CREATE INDEX "idx_crm_conversation_status_updated" ON "crm_conversations"("status", "updated_at");

CREATE INDEX "idx_crm_conversation_responsavel" ON "crm_conversations"("responsavel_id");

CREATE INDEX "idx_crm_message_conversation_created" ON "crm_messages"("conversation_id", "created_at");

ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "crm_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
