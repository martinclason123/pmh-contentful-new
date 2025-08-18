export default async function getLitters(id = null) {
  const url = new URL(
    `${process.env.ORIGIN_URL || "http://localhost:3000"}/api/litters`
  );

  // If an id is provided, add it as a query parameter
  if (id) {
    url.searchParams.append("id", id);
  }

  const response = await fetch(url);

  if (response.ok) {
    const data = await response.json();
  

    if (id) {
      return data.litters[0];
    } else {
      return data.litters;
    }
  } else {
    console.error("Failed to fetch litters:", response.statusText);
    return [];
  }
}
