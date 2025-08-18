import { createClient } from "contentful";
import { sanitizeImages } from "../../../utils";

export async function GET(req) {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_DELIVERY_KEY,
    environment: "master",
  });

  try {
    // Extract litterId from query parameters
    const { searchParams } = new URL(req.url);
    const litterId = searchParams.get("litterId");

    // Define the base query object
    let query = {
      content_type: "puppy",
      include: 2,
    };

    // If a litterId is provided, add the filter to the query
    if (litterId) {
      query["fields.litter.sys.contentType.sys.id"] = "litter";
      query["fields.litter.fields.id[match]"] = litterId;
    }

    // Fetch puppies based on the query
    const entries = await client.getEntries(query);

    // Clean up and structure the response
    const response = entries.items.map((entry) => {
      const {
        chip,
        name,
        hero,
        gallery,
        litter,
        gender,
        availability,
        description,
        deposit,
        priceOverride,
        buyer,
        buyerName,
        buyerEmail,
        buyerPhone,
      } = entry.fields;

      const dam = litter.fields.dam.fields;
      const sire = litter.fields.sire.fields;
      const breed = litter.fields.breed;

      return {
        chip,
        name,
        gender,
        hero: sanitizeImages(hero?.[0]?.url),
        gallery: gallery?.map((img) => sanitizeImages(img.url)) || [],
        price: priceOverride ? priceOverride : litter.fields.price,
        birthdate: litter.fields.birthdate,
        available: litter.fields.available,
        availability,
        description,
        deposit,
        breed,
        buyer,
        buyerName,
        buyerEmail,
        buyerPhone,
        parents: {
          dam: {
            name: dam.name,
            weight: dam.weight,
            image: sanitizeImages(dam.image[0]?.url || ""),
            breed: dam.breed[0],
            description: dam.description,
            certificationImages:
              dam.certifictionImages?.map((img) => sanitizeImages(img.url)) ||
              [],
            ofa: dam.ofa,
          },
          sire: {
            name: sire.name,
            weight: sire.weight,
            image: sanitizeImages(sire.image[0]?.url || ""),
            breed: sire.breed[0],
            description: sire.description,
            certificationImages:
              sire.certifictionImages?.map((img) => sanitizeImages(img.url)) ||
              [],
            ofa: sire.ofa,
          },
        },
      };
    });

    return new Response(JSON.stringify({ puppies: response }), {
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
