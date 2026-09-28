import { createClient } from "contentful-management";

async function getPuppyEntry(chip) {
  const client = createClient({
    accessToken: process.env.CONTENTFUL_CMA_TOKEN,
  });

  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment("master");
  const entries = await environment.getEntries({
    content_type: "puppy",
    "fields.chip[match]": chip,
  });

  if (entries.items.length === 0) {
    throw new Error("Puppy not found");
  }

  return entries.items[0];
}

export async function getManagedPuppy(chip) {
  try {
    const entry = await getPuppyEntry(chip);

    return Object.fromEntries(
      Object.entries(entry.fields).map(([field, locales]) => [
        field,
        locales["en-US"],
      ])
    );
  } catch (error) {
    console.error("Error fetching puppy for update:", error);
    throw new Error("Failed to fetch puppy");
  }
}

export async function updatePuppy(chip, updateData) {
  try {
    const entry = await getPuppyEntry(chip);

    // Update the fields with the provided updateData
    Object.keys(updateData).forEach((field) => {
      entry.fields[field] = {
        "en-US": updateData[field],
      };
    });

    const updatedEntry = await entry.update();
    await updatedEntry.publish();

    return updatedEntry;
  } catch (error) {
    console.error("Error updating puppy:", error);
    throw new Error("Failed to update puppy");
  }
}
