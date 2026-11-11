import { createHmac, timingSafeEqual } from "node:crypto";

export function stopToken(config, journey) {
  const digest = createHmac("sha256", config.linkSecret)
    .update(JSON.stringify([config.breederId, journey.id, journey.customerEmail]))
    .digest("hex");
  return `${journey.id}.${digest}`;
}

export function validStopToken(config, journey, token) {
  return /^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(token) &&
    timingSafeEqual(Buffer.from(stopToken(config, journey)), Buffer.from(token));
}
