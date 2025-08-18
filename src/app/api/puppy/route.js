import { createClient } from "contentful";
import { sanitizeImages } from "../../../utils";

export async function GET(req) {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_DELIVERY_KEY,
  });

  try {
    // Extract puppyId (chip) from query parameters
    const { searchParams } = new URL(req.url);
    const puppyId = searchParams.get("puppyId");

    // If no puppyId is provided, return an error
    if (!puppyId) {
      return new Response(JSON.stringify({ error: "puppyId is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Define the query object to search by the chip field
    const query = {
      content_type: "puppy",
      "fields.chip[match]": puppyId,
      include: 2,
    };

    // Fetch the specific puppy based on the chip (puppyId)
    const entries = await client.getEntries(query);

    if (!entries.items.length) {
      return new Response(JSON.stringify({ error: "Puppy not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Clean up and structure the response for the first matching puppy
    const entry = entries.items[0];

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

    const response = {
      chip,
      name,
      litter: litter.fields.id,
      gender: gender[0],
      hero: sanitizeImages(hero?.[0]?.url),
      gallery: gallery?.map((img) => sanitizeImages(img.url)) || [],
      price: priceOverride ? priceOverride : litter.fields.price,
      birthdate: litter.fields.birthdate,
      available: litter.fields.available,
      availability: availability[0],
      breed,
      description,
      deposit,
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
            dam.certifictionImages?.map((img) => sanitizeImages(img.url)) || [],
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

    return new Response(JSON.stringify({ puppy: response }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching Contentful entry:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
