export const schedulingByBreeder = {
  peacefulCountryPets: {
    name: "Peaceful Country Pets",
    calendlyUrl: "https://calendly.com/karaclason/30min",
  },
};

export function getBreederScheduling(breederId = "peacefulCountryPets") {
  return schedulingByBreeder[breederId] || null;
}
