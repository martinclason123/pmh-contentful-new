import styles from "./goldendoodles.module.css";
import { Subscribe } from "../../components";
import { NoResults, Header, Gallery, BreedInfo } from "../subcomponents";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title:
    "Goldendoodle Puppies for Sale | Standard & Mini Goldendoodles - Paw Prints on My Heart",
  description:
    "Discover high-quality Goldendoodle puppies for sale at Paw Prints on My Heart in Sheridan, MI. We offer both Standard and Mini Goldendoodles. Contact us today to reserve your new furry friend.",
  openGraph: {
    title:
      "Goldendoodle Puppies for Sale | Standard & Mini Goldendoodles - Paw Prints on My Heart",
    description:
      "Find your perfect Goldendoodle puppy at Paw Prints on My Heart. We offer both Standard and Mini Goldendoodles raised with love and care. Located in Sheridan, MI.",
    url: "https://www.pmhpuppies.com/goldendoodle-puppies",
    type: "website",
    images: [
      {
        url: "https://www.pmhpuppies.com/assets/og/goldendoodles.jpg",
        width: 1200,
        height: 630,
        alt: "Goldendoodle puppies at Paw Prints on My Heart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Goldendoodle Puppies for Sale | Standard & Mini Goldendoodles - Paw Prints on My Heart",
    description:
      "Explore Paw Prints on My Heart for high-quality Goldendoodle puppies. We offer both Standard and Mini Goldendoodles. Reserve your puppy today!",
    images: ["https://www.pmhpuppies.com/assets/og/goldendoodles.jpg"],
  },
};

export default async function Goldendoodles() {
  let puppies = await getPuppies();

  puppies = puppies.filter((puppy) => puppy.breed[0] === "Goldendoodle");

  const headerData = {
    header: "Goldendoodle Puppies",
    subheader: "Standard & Mini Goldendoodles Available",
    alt: "A Goldendoodle puppy for sale in Sheridan MI",
    image: {
      lg: "/assets/breeds/goldendoodles/gd-banner-bg-d",
      sm: "/assets/breeds/goldendoodles/gd-banner-bg-m",
    },
  };

  const noResultsCopy = {
    header: "Oops! Our Goldendoodle gang is resting",
    subheader:
      "We don't have any Goldendoodle puppies available right now, but new litters are on the way!",
    p: "Want to be the first to know when our next bundle of Goldendoodle joy arrives?",
    cta: "Subscribe for Puppy Updates",
    link: "#subscribe",
  };

  return (
    <article className={`container `}>
      <Header data={headerData} />
      {puppies.length === 0 ? (
        <NoResults copy={noResultsCopy} />
      ) : (
        <div className={styles.galleryWrapper}>
          <Gallery puppies={puppies} />
        </div>
      )}
      <BreedInfo breed={"Goldendoodle"} />
      <div className={styles.anchor} id="subscribe"></div>
      <Subscribe interests={["Goldendoodle"]} />
    </article>
  );
}
