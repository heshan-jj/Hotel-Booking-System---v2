-- 1. Enable required extensions for scheduled HTTP jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Unschedule if already present (ensures clean idempotent deployment)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-ical-every-2-hours') THEN
    PERFORM cron.unschedule('sync-ical-every-2-hours');
  END IF;
END $$;

-- 3. Schedule sync-ical edge function every 2 hours (at minute 0)
SELECT cron.schedule(
  'sync-ical-every-2-hours',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cocwsfukupbnqmgalmzs.supabase.co/functions/v1/sync-ical',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
