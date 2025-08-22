// app/cavapoo-puppies/page.jsx
export const dynamic = "force-dynamic";
import styles from "./cavapoos.module.css";
import { Subscribe } from "../../components";
import { NoResults, Header, Gallery, BreedInfo } from "../subcomponents";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title: "Cavapoo Puppies for Sale in Michigan | Paw Prints on My Heart",
  description:
    "Browse family-raised Cavapoo puppies at Paw Prints on My Heart in Sheridan, MI. Loving temperaments, well-socialized, and ready for forever homes.",
  openGraph: {
    title: "Cavapoo Puppies for Sale in Michigan | Paw Prints on My Heart",
    description:
      "Find your Cavapoo puppy raised with care in Sheridan, Michigan. Family-raised and well-socialized.",
    url: "https://pmhpuppies.com/cavapoo-puppies",
    type: "website",
    images: [
      {
        url: "https://pmhpuppies.com/assets/og/cavapoo-puppies.jpg",
        width: 1200,
        height: 630,
        alt: "Cavapoo puppies at Paw Prints on My Heart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cavapoo Puppies in Michigan | Paw Prints on My Heart",
    description:
      "Family-raised Cavapoos in Sheridan, MI—friendly, affectionate companions.",
    images: ["https://pmhpuppies.com/assets/og/cavapoo-puppies.jpg"],
  },
  alternates: {
    canonical: "/cavapoo-puppies",
  },
};

export default async function Cavapoos() {
  let puppies = await getPuppies();

  // Show only Cavapoos
  puppies = puppies.filter((puppy) => puppy.breed[0] === "Cavapoo");

  const headerData = {
    header: "Cavapoo Puppies",
    subheader: "",
    alt: "Cavapoo puppy for sale in Sheridan, MI",
    image: {
      lg: "/assets/breeds/cavapoo/cavapoo-banner-bg-d",
      sm: "/assets/breeds/cavapoo/cavapoo-banner-bg-m",
    },
  };

  const noResultsCopy = {
    header: `Oops!`,
    subheader:
      "We don't have any Cavapoo puppies available at the moment, but new litters are on the way.",
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
      <BreedInfo breed={"Cavapoo"} />
      <div className={styles.anchor} id="subscribe"></div>
      <Subscribe interests={["Cavapoo"]} />
    </article>
  );
}
