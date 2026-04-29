-- Tabela para registrar sessões de impersonation
-- Adicionar ao schema.sql existente

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  master_user_id CHAR(36) NOT NULL,   -- quem está impersonando
  impersonated_user_id CHAR(36) NOT NULL, -- quem está sendo impersonado
  reason TEXT,                         -- por que começou
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  session_token VARCHAR(512) NOT NULL, -- token da sessão original (master)
  original_session_token VARCHAR(512) NULL, -- sessão do usuário impersonado (se existia)
  expires_at DATETIME NOT NULL,
  
  FOREIGN KEY (master_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (impersonated_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_master (master_user_id, started_at DESC),
  INDEX idx_impersonated (impersonated_user_id, started_at DESC),
  INDEX idx_active_impersonation (master_user_id, ended_at) -- ended_at IS NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


