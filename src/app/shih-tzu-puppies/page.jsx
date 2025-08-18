import styles from "./shih-tzus.module.css";
import { Subscribe } from "../../components";
import { NoResults, Header, Gallery, BreedInfo } from "../subcomponents";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title: "Shih Tzu Puppies for Sale | Peaceful Country Pets",
  description:
    "Discover high-quality Shih Tzu puppies for sale at Peaceful Country Pets in Sheridan, MI. We offer AKC-registered Shih Tzus raised with love and care. Contact us today to reserve your new furry friend.",
  openGraph: {
    title: "Shih Tzu Puppies for Sale | Peaceful Country Pets",
    description:
      "Find your perfect Shih Tzu puppy at Peaceful Country Pets. We offer AKC-registered Shih Tzus raised with love and care in Sheridan, MI. Contact us to find your ideal companion today.",
    url: "https://www.peacefulcountrypets.com/shih-tzu-puppies",
    type: "website",
    images: [
      {
        url: "https://www.peacefulcountrypets.com/assets/og/shih-tzus.jpg",
        width: 1200,
        height: 630,
        alt: "Shih Tzu puppies at Peaceful Country Pets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shih Tzu Puppies for Sale | Peaceful Country Pets",
    description:
      "Explore Peaceful Country Pets for high-quality Shih Tzu puppies. We offer AKC-registered Shih Tzus raised with love in Sheridan, MI. Reserve your puppy today!",
    images: ["https://www.peacefulcountrypets.com/assets/og/shih-tzus.jpg"],
  },
};

export default async function ShihTzus() {
  let puppies = await getPuppies();

  puppies = puppies.filter((puppy) => puppy.breed[0] === "Shih Tzu");

  const headerData = {
    header: "Shih Tzu Puppies",
    subheader: "AKC Shih Tzus Available",
    alt: "A Shih Tzu puppy for sale in Sheridan MI",
    image: {
      lg: "/assets/breeds/Shih-Tzus/st-banner-bg-d",
      sm: "/assets/breeds/Shih-Tzus/st-banner-bg-m",
    },
  };

  const noResultsCopy = {
    header: "Oops! Our Shih Tzu gang is resting",
    subheader:
      "We don't have any Shih Tzu puppies available right now, but new litters are on the way!",
    p: "Want to be the first to know when our next bundle of Shih Tzu joy arrives?",
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
      <BreedInfo breed={"Shih Tzu"} />
      <div className={styles.anchor} id="subscribe"></div>
      <Subscribe interests={["Shih Tzu"]} />
    </article>
  );
}
