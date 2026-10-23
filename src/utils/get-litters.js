export default async function getLitters(id = null) {
  const url = new URL(
    "/api/litters",
    process.env.ORIGIN_URL || "http://localhost:3000"
  );

  if (id) {
    url.searchParams.set("id", id);
  }

  const response = await fetch(url);

  if (id && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    if (id) {
      throw new Error(`Failed to fetch litter (HTTP ${response.status})`);
    }

    console.error("Failed to fetch litters:", response.statusText);
    return [];
  }

  const data = await response.json();
  // The filtered API returns an empty list when the litter no longer exists.
  return id ? data.litters[0] ?? null : data.litters;
}
