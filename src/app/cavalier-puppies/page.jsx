// app/cavalier-puppies/page.jsx
export const dynamic = "force-dynamic";
import styles from "./cavaliers.module.css";
import { Subscribe } from "../../components";
import { NoResults, Header, Gallery, BreedInfo } from "../subcomponents";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title:
    "Cavalier King Charles Spaniel Puppies for Sale in Michigan | Paw Prints on My Heart",
  description:
    "Browse family-raised Cavalier King Charles Spaniel puppies (Blenheim, Tricolor, Ruby, Black & Tan) at Paw Prints on My Heart in Sheridan, MI. Loving temperaments, well-socialized, and ready for forever homes.",
  openGraph: {
    title:
      "Cavalier King Charles Spaniel Puppies for Sale in Michigan | Paw Prints on My Heart",
    description:
      "Find your Cavalier puppy—Blenheim, Tricolor, Ruby, or Black & Tan—raised with care in Sheridan, Michigan.",
    url: "https://pmhpuppies.com/cavalier-puppies",
    type: "website",
    images: [
      {
        url: "https://pmhpuppies.com/assets/og/cavalier-puppies.jpg",
        width: 1200,
        height: 630,
        alt: "Cavalier King Charles Spaniel puppies at Paw Prints on My Heart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Cavalier King Charles Spaniel Puppies in Michigan | Paw Prints on My Heart",
    description:
      "Family-raised Cavaliers in Sheridan, MI. Explore Blenheim, Tricolor, Ruby, and Black & Tan puppies.",
    images: ["https://pmhpuppies.com/assets/og/cavalier-puppies.jpg"],
  },
  alternates: {
    canonical: "/cavalier-puppies",
  },
};

export default async function Cavaliers() {
  let puppies = await getPuppies();

  // Keep: show only Cavaliers
  puppies = puppies.filter((puppy) => puppy.breed[0] === "Cavalier");

  const headerData = {
    header: "Cavalier Puppies",
    subheader: "",
    alt: "Cavalier King Charles Spaniel puppy for sale in Sheridan, MI",
    image: {
      lg: "/assets/breeds/cavalier/cavalier-banner-bg-d",
      sm: "/assets/breeds/cavalier/cavalier-banner-bg-m",
    },
  };

  const noResultsCopy = {
    header: `Oops! No Cavaliers available right now!`,
    subheader:
      "We don't have any Cavalier King Charles Spaniel puppies available at the moment, but new litters are on the way.",
    p: "Want to be first in line when the next litter arrives?",
    cta: "Subscribe for Puppy Updates",
    link: "#subscribe",
  };

  return (
    <article className={`container`}>
      <Header data={headerData} />
      {puppies.length === 0 ? (
        <NoResults copy={noResultsCopy} />
      ) : (
        <div className={styles.galleryWrapper}>
          <Gallery puppies={puppies} fullWidth={false} />
        </div>
      )}
      <BreedInfo breed={"Cavalier King Charles Spaniel"} />
      <div className={styles.anchor} id="subscribe"></div>
      <Subscribe interests={["Cavalier"]} />
    </article>
  );
}
