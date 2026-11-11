-- Preserve migration 001 and its checksum. Legacy M2 journeys used the approved
-- standard three-stage policy (7/14-day expiry). Keep that version in history.
ALTER TABLE customer_follow_up.journeys ADD COLUMN series_definition jsonb;
UPDATE customer_follow_up.journeys SET series_definition = '{"key":"standard-v1","stages":[{"id":"preparation","enabled":true,"offsetDays":-3,"template":"preparation","contentKey":"preparation","expiry":{"anchor":"pickup","days":0},"requiresPickup":false,"sendImmediatelyIfDue":true},{"id":"check-in","enabled":true,"offsetDays":7,"template":"check-in","contentKey":"check-in","expiry":{"anchor":"due","days":7},"requiresPickup":true,"sendImmediatelyIfDue":false},{"id":"review","enabled":true,"offsetDays":21,"template":"review","contentKey":"review","expiry":{"anchor":"due","days":14},"requiresPickup":true,"sendImmediatelyIfDue":false}]}'::jsonb;
ALTER TABLE customer_follow_up.journeys ALTER COLUMN series_definition SET NOT NULL;
ALTER TABLE customer_follow_up.journeys ADD CONSTRAINT journeys_series_definition_check
  CHECK (jsonb_typeof(series_definition) = 'object'
    AND series_definition ? 'key' AND jsonb_typeof(series_definition->'key') = 'string'
    AND series_definition ? 'stages' AND jsonb_typeof(series_definition->'stages') = 'array');
ALTER TABLE customer_follow_up.messages DROP CONSTRAINT messages_stage_check;
ALTER TABLE customer_follow_up.messages ADD CONSTRAINT messages_stage_identifier_check
  CHECK (stage ~ '^[a-z][a-z0-9-]{0,63}$');
ALTER TABLE customer_follow_up.messages ADD COLUMN stop_reason text;
