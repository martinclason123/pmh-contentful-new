CREATE TABLE customer_follow_up.journeys (
  breeder_id text NOT NULL,
  id text NOT NULL,
  root_invitee text NOT NULL,
  current_invitee text,
  customer_email text NOT NULL,
  puppy_chip text NOT NULL,
  pickup_at timestamptz,
  status text NOT NULL CHECK (status IN ('active', 'awaiting-replacement', 'canceled', 'stopped')),
  stop_reason text,
  schedule_version integer NOT NULL CHECK (schedule_version > 0),
  enrolled_at timestamptz NOT NULL,
  PRIMARY KEY (breeder_id, id),
  UNIQUE (breeder_id, root_invitee)
);
CREATE TABLE customer_follow_up.bookings (
  breeder_id text NOT NULL,
  invitee_uri text NOT NULL,
  facts jsonb NOT NULL,
  PRIMARY KEY (breeder_id, invitee_uri)
);
CREATE TABLE customer_follow_up.messages (
  breeder_id text NOT NULL,
  journey_id text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('preparation', 'check-in', 'review')),
  due_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'held', 'stopped', 'sent')),
  schedule_version integer NOT NULL,
  sent_at timestamptz,
  PRIMARY KEY (breeder_id, journey_id, stage),
  FOREIGN KEY (breeder_id, journey_id) REFERENCES customer_follow_up.journeys(breeder_id, id),
  CHECK (expires_at >= due_at)
);
CREATE INDEX messages_due ON customer_follow_up.messages (due_at) WHERE state = 'pending';
CREATE TABLE customer_follow_up.event_receipts (
  breeder_id text NOT NULL,
  receipt_key text NOT NULL,
  outcome text NOT NULL,
  processed_at timestamptz NOT NULL,
  PRIMARY KEY (breeder_id, receipt_key)
);
CREATE TABLE customer_follow_up.suppressions (
  breeder_id text NOT NULL,
  customer_email text NOT NULL CHECK (customer_email = lower(btrim(customer_email))),
  reason text NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (breeder_id, customer_email)
);
