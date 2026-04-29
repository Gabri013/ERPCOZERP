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

-- Trigger para log automático de impersonation
DELIMITER $$

CREATE TRIGGER trg_impersonation_start
AFTER INSERT ON impersonation_sessions
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs 
    (user_id, action, entity_id, metadata)
  VALUES
    (NEW.master_user_id, 'impersonation.start', NEW.impersonated_user_id,
     JSON_OBJECT(
       'master_user_id', NEW.master_user_id,
       'impersonated_user_id', NEW.impersonated_user_id,
       'reason', NEW.reason,
       'ip', NEW.ip_address,
       'started_at', NEW.started_at
     )
    );
END$$

CREATE TRIGGER trg_impersonation_end
AFTER UPDATE ON impersonation_sessions
FOR EACH ROW
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    INSERT INTO audit_logs 
      (user_id, action, entity_id, metadata)
    VALUES
      (NEW.master_user_id, 'impersonation.end', NEW.impersonated_user_id,
       JSON_OBJECT(
         'duration_seconds', TIMESTAMPDIFF(SECOND, NEW.started_at, NEW.ended_at),
         'ip', NEW.ip_address
       )
      );
  END IF;
END$$

DELIMITER ;
