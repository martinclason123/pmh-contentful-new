/**
 * Published series are versioned configuration. Copy to a new key when adding
 * stages or changing timing/content; existing journeys retain their snapshot.
 * Breeder identity and content sets remain in env, not in these shared rules.
 */
const definitions = {
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


const pickupV2 = {
  key: "pmh-pickup-v2",
  stages: definitions["standard-v1"].stages.map((stage) =>
    stage.id === "check-in"
      ? {
          ...stage,
          id: "pickup-day",
          offsetDays: 0,
          template: "pickup-day",
          contentKey: "pickup-day",
          expiry: { anchor: "due", days: 1 },
        }
      : stage,
  ),
};

const oneWeek = {
  ...definitions["standard-v1"].stages.find(({ id }) => id === "check-in"),
  id: "one-week",
  template: "one-week",
  contentKey: "one-week",
};

export const seriesDefinitions = {
  ...definitions,
  [pickupV2.key]: pickupV2,
  "pmh-pickup-v3": {
    key: "pmh-pickup-v3",
    stages: pickupV2.stages.flatMap((stage) =>
      stage.id === "pickup-day" ? [stage, oneWeek] : [stage],
    ),
  },
};
