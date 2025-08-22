
import { createClient } from "contentful";
import { sanitizeImages } from "../../../utils";

export async function GET(req) {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_DELIVERY_KEY,
    environment: "master",
  });

  try {
    // Extract id from query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Define the query object
    let query = {
      content_type: "litter",
    };

    // If id is provided, add the filter to the query
    if (id) {
      query["fields.id[match]"] = id;
    }

    // Fetch the entries
    const entries = await client.getEntries(query);

    const response = entries.items.map((litter) => {
      const { id, price, message, breed, dam, sire, hero, video, birthdate } =
        litter.fields;
      const returnObj = {
        id,
        price,
        message,
        breed: breed[0],
        hero: hero[0].url,
        video,
        birthdate,
        parents: {
          dam: {
            name: dam.fields.name,
            weight: dam.fields.weight,
            image: sanitizeImages(dam.fields.image[0]?.url || ""),
            breed: dam.fields.breed[0],
            description: dam.fields.description,
            certificationImages:
              dam.fields.certifictionImages?.map((img) =>
                sanitizeImages(img.url)
              ) || [],
            ofa: dam.fields.ofa,
          },
          sire: {
            name: sire.fields.name,
            weight: sire.fields.weight,
            image: sanitizeImages(sire.fields.image[0]?.url || ""),
            breed: sire.fields.breed[0],
            description: sire.fields.description,
            certificationImages:
              sire.fields.certifictionImages?.map((img) =>
                sanitizeImages(img.url)
              ) || [],
            ofa: sire.fields.ofa,
          },
        },
      };

      return returnObj;
    });

    return new Response(JSON.stringify({ litters: response }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching Contentful entries:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
