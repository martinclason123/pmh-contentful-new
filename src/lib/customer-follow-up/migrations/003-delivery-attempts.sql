CREATE TABLE customer_follow_up.delivery_attempts (
  breeder_id text NOT NULL,
  journey_id text NOT NULL,
  stage text NOT NULL,
  schedule_version integer NOT NULL,
  first_attempt_at timestamptz NOT NULL,
  last_attempt_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  provider_id text,
  PRIMARY KEY (breeder_id, journey_id, stage),
  FOREIGN KEY (breeder_id, journey_id, stage)
    REFERENCES customer_follow_up.messages(breeder_id, journey_id, stage) ON DELETE CASCADE
);
