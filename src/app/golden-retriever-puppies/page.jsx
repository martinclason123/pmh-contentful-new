import styles from "./goldens.module.css";
import { Subscribe } from "../../components";
import { NoResults, Header, Gallery, BreedInfo } from "../subcomponents";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title:
    "Golden Retriever Puppies for Sale | English Cream & Red Coats - Peaceful Country Pets",
  description:
    "Discover high-quality Golden Retriever puppies for sale at Peaceful Country Pets in Sheridan, MI. We offer English Cream Golden Retrievers and Red Coat puppies raised with love and care. Contact us today to reserve your new furry friend.",
  openGraph: {
    title:
      "Golden Retriever Puppies for Sale | English Cream & Red Coats - Peaceful Country Pets",
    description:
      "Find your perfect Golden Retriever puppy at Peaceful Country Pets. We have English Cream and Red Coat Golden Retrievers, raised with love and care in Sheridan, MI.",
    url: "https://www.peacefulcountrypets.com/golden-retriever-puppies",
    type: "website",
    images: [
      {
        url: "https://www.peacefulcountrypets.com/assets/og/golden-retrievers.jpg",
        width: 1200,
        height: 630,
        alt: "Golden Retriever puppies at Peaceful Country Pets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Golden Retriever Puppies for Sale | English Cream & Red Coats - Peaceful Country Pets",
    description:
      "Explore Peaceful Country Pets for high-quality Golden Retriever puppies. We offer both English Cream and Red Coat varieties. Reserve your puppy today!",
    images: [
      "https://www.peacefulcountrypets.com/assets/og/golden-retrievers.jpg",
    ],
  },
};

export default async function GoldenRetrievers() {
  let puppies = await getPuppies();

  puppies = puppies.filter((puppy) => puppy.breed[0] === "Golden Retriever");

  const headerData = {
    header: "Golden Retriever Puppies",
    subheader: "Golden Retrievers: English Cream and Red Coats Available",
    alt: "A golden retriever puppy for sale in Sheridan MI",
    image: {
      lg: "/assets/breeds/golden-retrievers/gr-banner-bg-d",
      sm: "/assets/breeds/golden-retrievers/gr-banner-bg-m",
    },
  };

  const noResultsCopy = {
    header: "Oops! Our Golden pack is taking a nap",
    subheader:
      "We don't have any Golden Retriever puppies available right now, but new litters are on the way!",
    p: "Want to be the first to know when our next bundle of golden joy arrives?",
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
      <BreedInfo breed={"Golden Retriever"} />
      <div className={styles.anchor} id="subscribe"></div>
      <Subscribe interests={["Golden Retriever"]} />
    </article>
  );
}
