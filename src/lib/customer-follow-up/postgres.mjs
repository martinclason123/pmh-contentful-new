import pg from "pg";

/** No shared idle pool: light webhook traffic opens one client and always closes it. */
export function createDatabaseClient(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", "verify-full");
  return new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 10000,
    application_name: "customer-follow-up",
    enableChannelBinding: true,
  });
}

const iso = (value) => (value ? new Date(value).toISOString() : null);
function journeyFrom(row) {
  return row
    ? {
        id: row.id,
        rootInvitee: row.root_invitee,
        currentInvitee: row.current_invitee,
        customerEmail: row.customer_email,
        puppyChip: row.puppy_chip,
        pickupAt: iso(row.pickup_at),
        status: row.status,
        stopReason: row.stop_reason,
        scheduleVersion: row.schedule_version,
        enrolledAt: iso(row.enrolled_at),
        series: row.series_definition,
      }
    : null;
}
function messageFrom(row) {
  return {
    journeyId: row.journey_id,
    stage: row.stage,
    dueAt: iso(row.due_at),
    expiresAt: iso(row.expires_at),
    state: row.state,
    scheduleVersion: row.schedule_version,
    sentAt: iso(row.sent_at),
    stopReason: row.stop_reason,
  };
}

function transactionStore(client, breederId) {
  const query = (sql, values = []) => client.query(sql, [breederId, ...values]);
  return {
    async hasReceipt(key) {
      return (
        (
          await query(
            "SELECT 1 FROM customer_follow_up.event_receipts WHERE breeder_id=$1 AND receipt_key=$2",
            [key],
          )
        ).rowCount > 0
      );
    },
    async putReceipt(key, outcome, time) {
      await query(
        "INSERT INTO customer_follow_up.event_receipts VALUES ($1,$2,$3,$4)",
        [key, outcome, time],
      );
    },
    async getBooking(uri) {
      return (
        (
          await query(
            "SELECT facts FROM customer_follow_up.bookings WHERE breeder_id=$1 AND invitee_uri=$2",
            [uri],
          )
        ).rows[0]?.facts ?? null
      );
    },
    async putBooking(booking) {
      await query(
        "INSERT INTO customer_follow_up.bookings VALUES ($1,$2,$3) ON CONFLICT (breeder_id,invitee_uri) DO UPDATE SET facts=EXCLUDED.facts",
        [booking.uri, booking],
      );
    },
    async getJourneyByRoot(root) {
      return journeyFrom(
        (
          await query(
            "SELECT * FROM customer_follow_up.journeys WHERE breeder_id=$1 AND root_invitee=$2",
            [root],
          )
        ).rows[0],
      );
    },
    async getJourney(id) {
      return journeyFrom((await query(
        "SELECT * FROM customer_follow_up.journeys WHERE breeder_id=$1 AND id=$2",
        [id],
      )).rows[0]);
    },
    async suppress(email, time) {
      await query(
        "INSERT INTO customer_follow_up.suppressions VALUES ($1,$2,'customer-opt-out',$3) ON CONFLICT DO NOTHING",
        [email, time],
      );
    },
    async dueDeliveries(stages, now, limit, journeyId, maxAttempts, retryHours) {
      return (await query(
        `SELECT m.journey_id AS "journeyId", m.stage
         FROM customer_follow_up.messages m
         JOIN customer_follow_up.journeys j ON (m.breeder_id,m.journey_id)=(j.breeder_id,j.id)
         LEFT JOIN customer_follow_up.delivery_attempts a ON (m.breeder_id,m.journey_id,m.stage)=(a.breeder_id,a.journey_id,a.stage)
         WHERE m.breeder_id=$1 AND m.stage=ANY($2::text[]) AND m.state='pending'
           AND j.status='active' AND j.schedule_version=m.schedule_version
           AND m.due_at<=$3 AND m.expires_at>$3 AND ($5::text IS NULL OR m.journey_id=$5)
           AND NOT EXISTS (SELECT 1 FROM customer_follow_up.suppressions s
             WHERE s.breeder_id=m.breeder_id AND s.customer_email=j.customer_email)
           AND (a.attempts IS NULL OR (a.provider_id IS NULL AND a.attempts<$6
             AND a.schedule_version=m.schedule_version
             AND a.first_attempt_at + $7::int * interval '1 hour'>$3
             AND a.last_attempt_at + interval '2 minutes'<=$3))
         ORDER BY m.due_at, m.journey_id, m.stage LIMIT $4`,
        [stages, now, limit, journeyId, maxAttempts, retryHours],
      )).rows;
    },
    async getAttempt(id, stage) {
      return (await query(
        "SELECT * FROM customer_follow_up.delivery_attempts WHERE breeder_id=$1 AND journey_id=$2 AND stage=$3",
        [id, stage],
      )).rows[0] ?? null;
    },
    async reserveAttempt(message, time) {
      await query(
        `INSERT INTO customer_follow_up.delivery_attempts
         (breeder_id,journey_id,stage,schedule_version,first_attempt_at,last_attempt_at,attempts)
         VALUES ($1,$2,$3,$4,$5,$5,1)
         ON CONFLICT (breeder_id,journey_id,stage) DO UPDATE
         SET last_attempt_at=EXCLUDED.last_attempt_at, attempts=delivery_attempts.attempts+1`,
        [message.journeyId, message.stage, message.scheduleVersion, time],
      );
    },
    async markSent(message, time, providerId) {
      await query(
        "UPDATE customer_follow_up.delivery_attempts SET provider_id=$4 WHERE breeder_id=$1 AND journey_id=$2 AND stage=$3",
        [message.journeyId, message.stage, providerId],
      );
      await query(
        "UPDATE customer_follow_up.messages SET state='sent', sent_at=$4 WHERE breeder_id=$1 AND journey_id=$2 AND stage=$3",
        [message.journeyId, message.stage, time],
      );
    },
    async getJourneys() {
      return (
        await query(
          "SELECT * FROM customer_follow_up.journeys WHERE breeder_id=$1 ORDER BY id",
        )
      ).rows.map(journeyFrom);
    },
    async countJourneys() {
      return Number(
        (
          await query(
            "SELECT count(*) FROM customer_follow_up.journeys WHERE breeder_id=$1",
          )
        ).rows[0].count,
      );
    },
    async isSuppressed(email) {
      return (
        (
          await query(
            "SELECT 1 FROM customer_follow_up.suppressions WHERE breeder_id=$1 AND customer_email=$2",
            [email],
          )
        ).rowCount > 0
      );
    },
    async putJourney(journey) {
      await query(
        `INSERT INTO customer_follow_up.journeys
        (breeder_id,id,root_invitee,current_invitee,customer_email,puppy_chip,pickup_at,status,stop_reason,schedule_version,enrolled_at,series_definition)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (breeder_id,id) DO UPDATE SET current_invitee=EXCLUDED.current_invitee, customer_email=EXCLUDED.customer_email,
        pickup_at=EXCLUDED.pickup_at, status=EXCLUDED.status, stop_reason=EXCLUDED.stop_reason, schedule_version=EXCLUDED.schedule_version`,
        [
          journey.id,
          journey.rootInvitee,
          journey.currentInvitee,
          journey.customerEmail,
          journey.puppyChip,
          journey.pickupAt,
          journey.status,
          journey.stopReason,
          journey.scheduleVersion,
          journey.enrolledAt,
          journey.series,
        ],
      );
    },
    async getMessages(id) {
      return (
        await query(
          "SELECT * FROM customer_follow_up.messages WHERE breeder_id=$1 AND journey_id=$2 ORDER BY due_at",
          [id],
        )
      ).rows.map(messageFrom);
    },
    async putMessage(message) {
      await query(
        `INSERT INTO customer_follow_up.messages (breeder_id,journey_id,stage,due_at,expires_at,state,schedule_version,sent_at,stop_reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (breeder_id,journey_id,stage) DO UPDATE
        SET due_at=EXCLUDED.due_at, expires_at=EXCLUDED.expires_at, state=EXCLUDED.state, schedule_version=EXCLUDED.schedule_version, stop_reason=EXCLUDED.stop_reason
        WHERE customer_follow_up.messages.state NOT IN ('sent', 'stopped')`,
        [
          message.journeyId,
          message.stage,
          message.dueAt,
          message.expiresAt,
          message.state,
          message.scheduleVersion,
          message.sentAt,
          message.stopReason ?? null,
        ],
      );
    },
  };
}

/** Transactions protect durable receipts, journey versions and unique stage records. */
export function createPostgresRepository({
  connectionString,
  createClient = createDatabaseClient,
}) {
  return {
    async transaction(breederId, action) {
      const client = createClient(connectionString);
      let open = false;
      try {
        await client.connect();
        await client.query("BEGIN");
        open = true;
        await client.query("SET LOCAL statement_timeout = '10s'");
        await client.query("SET LOCAL lock_timeout = '5s'");
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1, 10608))",
          [breederId],
        );
        const result = await action(transactionStore(client, breederId));
        await client.query("COMMIT");
        open = false;
        return result;
      } catch (error) {
        if (open) await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        await client.end();
      }
    },
  };
}
