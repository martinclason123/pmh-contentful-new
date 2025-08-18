export default async function getPuppies(litterId) {
  // Construct the base URL
  let url = `${process.env.ORIGIN_URL || "http://localhost:3000"}/api/puppies`;

  // Append the litterId query parameter if it's provided
  if (litterId) {
    url += `?litterId=${encodeURIComponent(litterId)}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return data.puppies;
    } else {
      console.error("Failed to fetch puppies:", response.statusText);
      return [];
    }
  } catch (error) {
    console.error("Error fetching puppies:", error);
    return [];
  }
}
