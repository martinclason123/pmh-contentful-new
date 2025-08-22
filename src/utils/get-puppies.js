export default async function getPuppies(litterId) {
  // Construct the base URL
  let url = process.env.ORIGIN_URL;
  // Append the litterId query parameter if it's provided
  if (litterId) {
    url += `?litterId=${encodeURIComponent(litterId)}`;
  }

  console.log("URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    console.log("Response:", response);
    console.log(Object.keys(response.json()));

    if (response.ok) {
      const data = await response.json();
      return data.puppies;
    } else {
      console.error("Failed to fetch puppies:", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching puppies:", error);
    return [];
  }
}
