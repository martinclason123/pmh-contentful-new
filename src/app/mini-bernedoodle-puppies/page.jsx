import styles from "./bernedoodles.module.css";
import { Subscribe } from "../../components";
import { NoResults, Header, Gallery, BreedInfo } from "../subcomponents";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title: "Mini Bernedoodle Puppies for Sale | Paw Prints on My Heart",
  description:
    "Discover high-quality Mini Bernedoodle puppies for sale at Paw Prints on My Heart in Sheridan, MI. We offer beautiful, family-raised Mini Bernedoodles. Contact us today to reserve your new furry friend.",
  openGraph: {
    title: "Mini Bernedoodle Puppies for Sale | Paw Prints on My Heart",
    description:
      "Find your perfect Mini Bernedoodle puppy at Paw Prints on My Heart. Raised with love and care, our Mini Bernedoodles are a perfect family companion. Located in Sheridan, MI.",
    url: "https://www.pmhpuppies.com/mini-bernedoodle-puppies",
    type: "website",
    images: [
      {
        url: "https://www.pmhpuppies.com/assets/og/mini-bernedoodles.jpg",
        width: 1200,
        height: 630,
        alt: "Mini Bernedoodle puppies at Paw Prints on My Heart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mini Bernedoodle Puppies for Sale | Paw Prints on My Heart",
    description:
      "Explore Paw Prints on My Heart for high-quality Mini Bernedoodle puppies. Reserve your puppy today!",
    images: ["https://www.pmhpuppies.com/assets/og/mini-bernedoodles.jpg"],
  },
};

export default async function MiniBernedoodles() {
  let puppies = await getPuppies();

  puppies = puppies.filter((puppy) => puppy.breed[0] === "Mini Bernedoodle");

  const headerData = {
    header: "Mini Bernedoodle Puppies",
    subheader: "Loving and Affectionate Family Companions",
    alt: "A Mini Bernedoodle puppy for sale in Sheridan MI",
    image: {
      lg: "/assets/breeds/mini-bernedoodles/mbd-banner-bg-d",
      sm: "/assets/breeds/mini-bernedoodles/mbd-banner-bg-m",
    },
  };

  const noResultsCopy = {
    header: "Oops!",
    subheader:
      "We don't have any Mini Bernedoodle puppies available right now, but new litters are on the way!",
    p: "Want to be the first to know when our next bundle of Mini Bernedoodle joy arrives?",
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
      <BreedInfo breed={"Mini Bernedoodle"} />
      <div className={styles.anchor} id="subscribe"></div>
      <Subscribe interests={["Mini Bernedoodle"]} />
    </article>
  );
}
