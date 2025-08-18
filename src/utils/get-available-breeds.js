export default function getAvailableBreeds(puppies) {
  let breeds = {};
  puppies.forEach((puppy) => {
    if (!breeds[puppy.breed[0]]) {
      breeds[puppy.breed[0]] = 1;
    } else {
      breeds[puppy.breed[0]]++;
    }
  });

  let formattedBreeds = [];
  Object.keys(breeds).forEach((key) => {
    formattedBreeds.push({
      message: `${key}s - ${breeds[key]}`,
      link: `/puppies?breed=${encodeURIComponent(key)}`,
    });
  });

  return formattedBreeds;
}
