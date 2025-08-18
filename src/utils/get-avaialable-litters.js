import formatDate from "./format-date";

export default function getAvailableLitters(litters) {
  return litters.map((litter) => {
    return {
      message: `${litter.breed} - Born ${formatDate(litter.birthdate)}`,
      link: `/litters/${litter.id}`,
    };
  });
}
