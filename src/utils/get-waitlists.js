import { createClient } from "contentful";

export default async function getWaitlists() {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_DELIVERY_KEY,
  });

  try {
    // 1) Waitlists
    const waitlistEntries = await client.getEntries({
      content_type: "waitlist",
      limit: 200,
    });

    const waitlists = waitlistEntries.items.map((w) => ({
      id: w.sys.id,
      breed: w.fields.breed,
    }));

    // 2) Members referencing those waitlists (reverse association)
    const idsCsv = waitlists.map((w) => w.id).join(",");

    const memberEntries = await client.getEntries({
      content_type: "waitlistMember",
      include: 1,
      limit: 1000,
      "fields.breed.sys.id[in]": idsCsv,
    });

    // 3) Associations: { [waitlistId]: { breed, members: [...] } }
    const assoc = Object.fromEntries(
      waitlists.map((w) => [w.id, { breed: w.breed, members: [] }])
    );

    memberEntries.items.forEach((m) => {
      const waitlistId = m.fields?.breed?.sys?.id;
      if (!waitlistId || !assoc[waitlistId]) return;

      assoc[waitlistId].members.push({
        id: m.sys.id,
        name: m.fields.name,
        phone: m.fields.phone,
        email: m.fields.email,
        code: m.fields.code,
        position: m.fields.position,
      });
    });

    console.log("waitlist associations", assoc);

    return assoc;
  } catch (error) {
    console.error("Error fetching waitlists/members:", error);
    return null;
  }
}
