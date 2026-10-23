export default async function getPuppy(puppyId) {
  const url = new URL(
    "/api/puppy",
    process.env.ORIGIN_URL || "http://localhost:3000"
  );

  if (puppyId) {
    url.searchParams.set("puppyId", puppyId);
  }

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  // Missing records are expected; outages must still surface as server errors.
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch puppy (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.puppy;
}
