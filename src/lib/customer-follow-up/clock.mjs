/** Production clock contract; tests inject a clock with the same now() method. */
export const systemClock = Object.freeze({ now: () => Date.now() });
