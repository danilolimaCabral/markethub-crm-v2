-- ============================================
-- CONSULTA DE WEBHOOKS RECEBIDOS
-- ============================================

-- 1. Últimas notificações recebidas
SELECT 
  id,
  sync_type,
  status,
  details::json->>'_id' as notification_id,
  details::json->>'topic' as topic,
  details::json->>'resource' as resource,
  details::json->>'user_id' as user_id,
  started_at,
  completed_at,
  error_message
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
ORDER BY started_at DESC
LIMIT 20;

-- 2. Contagem por tipo de webhook
SELECT 
  sync_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
  SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
GROUP BY sync_type
ORDER BY total DESC;

-- 3. Taxa de sucesso geral
SELECT 
  COUNT(*) as total_webhooks,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%';

-- 4. Webhooks nas últimas 24 horas
SELECT 
  DATE_TRUNC('hour', started_at) as hour,
  COUNT(*) as webhooks_received
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND started_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- 5. Últimos erros
SELECT 
  sync_type,
  error_message,
  details,
  started_at
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND status = 'error'
ORDER BY started_at DESC
LIMIT 10;
