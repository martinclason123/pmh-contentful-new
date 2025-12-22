// src/utils/stripe/addToWaitlist.js
import { createClient } from "contentful-management";

/**
 * Creates a new `waitlistMember` entry associated to a `waitlist` entry.
 *
 * Contentful:
 *  - waitlist content type: "waitlist"
 *  - waitlist member content type: "waitlistMember"
 *  - waitlistMember fields: breed (Ref -> waitlist), name, phone, email, code, position
 *
 * Payload (from Stripe metadata):
 *  {
 *    transactionType: "waitlist",
 *    requestId,
 *    waitlistId,
 *    breedName, // optional
 *    name,
 *    phone,
 *    email,
 *    code
 *  }
 */
export default async function addToWaitlist(payload) {
  try {
    // Keep logs tight + useful
    console.log("[addToWaitlist] start", {
      requestId: payload?.requestId,
      waitlistId: payload?.waitlistId,
      name: payload?.name,
      phone: payload?.phone,
      email: payload?.email,
      code: payload?.code,
    });

    const waitlistId = payload?.waitlistId;
    const name = payload?.name;
    const phone = payload?.phone;
    const email = payload?.email;
    const code = payload?.code;

    // Minimal validation (fail loud; webhook should alert you)
    if (!waitlistId) throw new Error("Missing payload.waitlistId");
    if (!name) throw new Error("Missing payload.name");
    if (!phone) throw new Error("Missing payload.phone");
    if (!email) throw new Error("Missing payload.email");
    if (!code) throw new Error("Missing payload.code");

    const client = createClient({
      accessToken: process.env.CONTENTFUL_CMA_TOKEN,
    });

    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment(
      process.env.CONTENTFUL_ENVIRONMENT || "master"
    );

    // Determine next position for this waitlist
    // Prefer direct field query; fall back to `links_to_entry` if needed.
    let existingCount = 0;
    let nextPosition = 1;

    try {
      const existing = await environment.getEntries({
        content_type: "waitlistMember",
        "fields.breed.sys.id": waitlistId,
        limit: 1000,
        select: "sys.id,fields.position",
      });

      existingCount = existing?.items?.length || 0;

      const maxPos = existing.items.reduce((max, item) => {
        const p = item?.fields?.position?.["en-US"];
        return typeof p === "number" && p > max ? p : max;
      }, 0);

      nextPosition = maxPos + 1;
    } catch (err) {
      // Fallback (less strict, but works if the field query is finicky)
      const existing = await environment.getEntries({
        content_type: "waitlistMember",
        links_to_entry: waitlistId,
        limit: 1000,
        select: "sys.id,fields.position",
      });

      existingCount = existing?.items?.length || 0;

      const maxPos = existing.items.reduce((max, item) => {
        const p = item?.fields?.position?.["en-US"];
        return typeof p === "number" && p > max ? p : max;
      }, 0);

      nextPosition = maxPos + 1;
    }

    // Create waitlistMember
    const entry = await environment.createEntry("waitlistMember", {
      fields: {
        breed: {
          "en-US": {
            sys: {
              type: "Link",
              linkType: "Entry",
              id: waitlistId,
            },
          },
        },
        name: { "en-US": name },
        phone: { "en-US": phone },
        email: { "en-US": email },
        code: { "en-US": code },
        position: { "en-US": nextPosition },
      },
    });

    const published = await entry.publish();

    console.log("[addToWaitlist] created", {
      waitlistId,
      memberId: published?.sys?.id,
      position: nextPosition,
      previousMembers: existingCount,
    });

    return {
      ok: true,
      memberId: published?.sys?.id,
      position: nextPosition,
    };
  } catch (error) {
    console.error("[addToWaitlist] failed", {
      message: error?.message || error,
      waitlistId: payload?.waitlistId,
      requestId: payload?.requestId,
    });
    throw error;
  }
}
