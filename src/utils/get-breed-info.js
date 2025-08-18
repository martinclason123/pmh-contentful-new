import breedsData from "../data/breeds.json";

export default function getBreedInfo(breed) {
  const breedInfo = breedsData.breeds[breed];
  if (!breedInfo) {
    throw new Error(`Breed information for '${breed}' not found.`);
  }
  return breedInfo;
}
