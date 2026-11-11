/**
 * Published series are versioned configuration. Copy to a new key when adding
 * stages or changing timing/content; existing journeys retain their snapshot.
 * Breeder identity and content sets remain in env, not in these shared rules.
 */
export const seriesDefinitions = {
  "standard-v1": {
    key: "standard-v1",
    stages: [
      {
        id: "preparation",
        enabled: true,
        offsetDays: -3,
        template: "preparation",
        contentKey: "preparation",
        expiry: { anchor: "pickup", days: 0 },
        requiresPickup: false,
        sendImmediatelyIfDue: true,
      },
      {
        id: "check-in",
        enabled: true,
        offsetDays: 7,
        template: "check-in",
        contentKey: "check-in",
        expiry: { anchor: "due", days: "checkInExpiryDays" },
        requiresPickup: true,
        sendImmediatelyIfDue: false,
      },
      {
        id: "review",
        enabled: true,
        offsetDays: 21,
        template: "review",
        contentKey: "review",
        expiry: { anchor: "due", days: "reviewExpiryDays" },
        requiresPickup: true,
        sendImmediatelyIfDue: false,
      },
    ],
  },
};
