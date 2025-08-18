import { createClient } from "contentful-management";

export async function updatePuppy(chip, updateData) {
  const client = createClient({
    accessToken: process.env.CONTENTFUL_CMA_TOKEN,
  });

  try {
    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment("master"); // or use your specific environment name

    // Fetch the puppy entry by the chip field
    const entries = await environment.getEntries({
      content_type: "puppy",
      "fields.chip[match]": chip,
    });

    if (entries.items.length === 0) {
      throw new Error("Puppy not found");
    }

    const entry = entries.items[0];

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
