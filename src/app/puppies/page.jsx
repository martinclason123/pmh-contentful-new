export const dynamic = "force-dynamic";
import Link from "next/link";
import { Gallery } from "../subcomponents";
import styles from "./puppies.module.css";
import { Subscribe, PuppiesGallery } from "../../components";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title:
    "Available Puppies | AKC Dachshunds, Golden Retrievers, & Shih Tzus - Peaceful Country Pets",
  description:
    "Explore our available puppies at Peaceful Country Pets. We offer AKC Dachshunds, Golden Retrievers, and Shih Tzus. Filter by breed, availability, and gender to find your perfect puppy.",
  openGraph: {
    title:
      "Available Puppies | AKC Dachshunds, Golden Retrievers, & Shih Tzus - Peaceful Country Pets",
    description:
      "Explore our available puppies at Peaceful Country Pets. We offer AKC Dachshunds, Golden Retrievers, and Shih Tzus. Filter by breed, availability, and gender to find your perfect puppy.",
    url: "https://www.peacefulcountrypets.com/puppies",
    type: "website",
    images: [
      {
        url: "https://www.peacefulcountrypets.com/assets/og/available-puppies.jpg",
        width: 1200,
        height: 630,
        alt: "Puppies at Peaceful Country Pets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Available Puppies | AKC Dachshunds, Golden Retrievers, & Shih Tzus - Peaceful Country Pets",
    description:
      "Explore our available puppies at Peaceful Country Pets. We offer AKC Dachshunds, Golden Retrievers, and Shih Tzus. Filter by breed, availability, and gender to find your perfect puppy.",
    images: [
      "https://www.peacefulcountrypets.com/assets/og/available-puppies.jpg",
    ],
  },
};

export default async function Puppies({ searchParams }) {
  const breedParam = searchParams.breed;
  let puppies = await getPuppies();
  return <PuppiesGallery puppies={puppies} breedParam={breedParam} />;
}
