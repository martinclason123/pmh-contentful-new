/** Small transactional adapter for fast rule tests; SQL tests use the real repository. */
export function createMemoryRepository() {
  let state = {
    bookings: [],
    journeys: [],
    messages: [],
    receipts: [],
    suppressions: [],
  };
  let queue = Promise.resolve();
  return {
    async transaction(breederId, action) {
      const previous = queue;
      let release;
      queue = new Promise((resolve) => {
        release = resolve;
      });
      await previous;
      const working = structuredClone(state);
      const scoped = (table) =>
        working[table].filter((row) => row.breederId === breederId);
      const put = (table, value, match) => {
        const index = working[table].findIndex(
          (row) => row.breederId === breederId && match(row),
        );
        const row = { ...structuredClone(value), breederId };
        if (index < 0) working[table].push(row);
        else working[table][index] = row;
      };
      const tx = {
        async hasReceipt(key) {
          return scoped("receipts").some((row) => row.key === key);
        },
        async putReceipt(key, outcome, time) {
          put("receipts", { key, outcome, time }, (row) => row.key === key);
        },
        async getBooking(uri) {
          return structuredClone(
            scoped("bookings").find((row) => row.uri === uri) ?? null,
          );
        },
        async putBooking(booking) {
          put("bookings", booking, (row) => row.uri === booking.uri);
        },
        async getJourneyByRoot(root) {
          return structuredClone(
            scoped("journeys").find((row) => row.rootInvitee === root) ?? null,
          );
        },
        async getJourneys() {
          return structuredClone(scoped("journeys"));
        },
        async countJourneys() {
          return scoped("journeys").length;
        },
        async isSuppressed(email) {
          return scoped("suppressions").some((row) => row.email === email);
        },
        async putJourney(journey) {
          put("journeys", journey, (row) => row.id === journey.id);
        },
        async getMessages(id) {
          return structuredClone(
            scoped("messages").filter((row) => row.journeyId === id),
          );
        },
        async putMessage(message) {
          const existing = scoped("messages").find(
            (row) =>
              row.journeyId === message.journeyId &&
              row.stage === message.stage,
          );
          if (!["sent", "stopped"].includes(existing?.state))
            put(
              "messages",
              message,
              (row) =>
                row.journeyId === message.journeyId &&
                row.stage === message.stage,
            );
        },
      };
      try {
        const result = await action(tx);
        state = working;
        return result;
      } finally {
        release();
      }
    },
    async snapshot(breederId) {
      const rows = (table) =>
        structuredClone(
          state[table]
            .filter((row) => row.breederId === breederId)
            .map(({ breederId: ignored, ...row }) => {
              void ignored;
              return row;
            }),
        );
      return {
        journeys: rows("journeys"),
        messages: rows("messages"),
        receipts: rows("receipts"),
      };
    },
    async markSent(breederId, stage, time) {
      for (const row of state.messages)
        if (row.breederId === breederId && row.stage === stage) {
          row.state = "sent";
          row.sentAt = time;
        }
    },
    async stop(breederId) {
      for (const row of state.journeys)
        if (row.breederId === breederId) {
          row.status = "stopped";
          row.stopReason = "staff-no-show";
        }
    },
    async suppress(breederId, email) {
      state.suppressions.push({ breederId, email });
    },
  };
}
