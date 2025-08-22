export const dynamic = "force-dynamic";
import Link from "next/link";
import { Gallery } from "../subcomponents";
import styles from "./puppies.module.css";
import { Subscribe, PuppiesGallery } from "../../components";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  metadataBase: new URL("https://www.pmhpuppies.com"),
  title:
    "Available Puppies | Goldendoodles, Mini Bernedoodles, Cavaliers & Cavapoos - Paw Prints on My Heart",
  description:
    "Explore our available puppies at Paw Prints on My Heart. We offer Goldendoodles, Mini Bernedoodles, Cavaliers, and Cavapoos. Filter by breed, availability, and gender to find your perfect puppy.",
  alternates: {
    canonical: "/puppies",
  },
  openGraph: {
    title:
      "Available Puppies | Goldendoodles, Mini Bernedoodles, Cavaliers & Cavapoos - Paw Prints on My Heart",
    description:
      "Explore our available puppies at Paw Prints on My Heart. We offer Goldendoodles, Mini Bernedoodles, Cavaliers, and Cavapoos. Filter by breed, availability, and gender to find your perfect puppy.",
    url: "/puppies",
    type: "website",
    images: [
      {
        url: "/assets/og/available-puppies.jpg",
        width: 1200,
        height: 630,
        alt: "Puppies at Paw Prints on My Heart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Available Puppies | Goldendoodles, Mini Bernedoodles, Cavaliers & Cavapoos - Paw Prints on My Heart",
    description:
      "Explore our available puppies at Paw Prints on My Heart. We offer Goldendoodles, Mini Bernedoodles, Cavaliers, and Cavapoos. Filter by breed, availability, and gender to find your perfect puppy.",
    images: ["/assets/og/og-image-01.jpg"],
  },
};

export default async function Puppies({ searchParams }) {
  const breedParam = searchParams.breed;
  let puppies = await getPuppies();
  return <PuppiesGallery puppies={puppies} breedParam={breedParam} />;
}
