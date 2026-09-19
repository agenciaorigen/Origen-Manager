-- Programa el resumen diario de notificaciones (8:00 hs Argentina = 11:00 UTC).
-- Reemplazá TU_PROYECTO (la parte inicial de tu Project URL) y TU_CLAVE_CRON (la que figura en tus instrucciones).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'origen-recordatorios', '0 11 * * *',
  $$ select net.http_post(
       url := 'https://TU_PROYECTO.supabase.co/functions/v1/send-reminders',
       headers := '{"Content-Type":"application/json","x-cron-secret":"TU_CLAVE_CRON"}'::jsonb,
       body := '{}'::jsonb) $$);

-- PRUEBA inmediata (envía una notificación de prueba a tus dispositivos):
-- select net.http_post(
--   url := 'https://TU_PROYECTO.supabase.co/functions/v1/send-reminders',
--   headers := '{"Content-Type":"application/json","x-cron-secret":"TU_CLAVE_CRON"}'::jsonb,
--   body := '{"test":true}'::jsonb);
