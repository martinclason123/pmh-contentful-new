export const dynamic = "force-dynamic";
import path from "path";
import { promises as fs } from "fs";

export async function POST(req) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.UPDATE_LOCAL_KEY) {
      return new Response("Forbidden", { status: 403 });
    }

    const filePath = path.resolve(process.cwd(), "src", "data", "puppies.json");
    const file = await fs.readFile(filePath, "utf8");

    const updates = await req.json();

    let puppies = JSON.parse(file);

    for (let puppy of puppies) {
      if (puppy.id === updates.id) {
        for (let key in updates) {
          if (updates.hasOwnProperty(key)) {
            puppy[key] = updates[key];
          }
        }
      }
    }

    const updatesJSON = JSON.stringify(puppies, null, 2);

    // Overwrite the JSON file with updated data
    await fs.writeFile(filePath, updatesJSON, "utf8");

    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error("Error updating puppies JSON:", error);
    return new Response(error.message, { status: 500 });
  }
}
