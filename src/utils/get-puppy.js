export default async function getPuppy(puppyId) {
  // Construct the base URL
  let url = `${process.env.ORIGIN_URL || "http://localhost:3000"}/api/puppy`;

  // Append the puppyId query parameters
  if (puppyId) {
    url += `?puppyId=${encodeURIComponent(puppyId)}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return data.puppy;
    } else {
      console.error("Failed to fetch puppy:", response.statusText);
      return {};
    }
  } catch (error) {
    console.error("Error fetching puppy:", error);
    return {};
  }
}
