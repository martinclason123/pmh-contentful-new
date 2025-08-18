import styles from "./dachshund.module.css";
import { Subscribe } from "../../components";
import { NoResults, Header, Gallery, BreedInfo } from "../subcomponents";
import getPuppies from "../../utils/get-puppies";

export const metadata = {
  title: "Mini Dachshund Puppies for Sale | Peaceful Country Pets",
  description:
    "Discover adorable Mini Dachshund puppies for sale at Peaceful Country Pets in Sheridan, MI. We offer well-socialized Mini Dachshunds. Contact us today to reserve your new furry friend.",
  openGraph: {
    title: "Mini Dachshund Puppies for Sale | Peaceful Country Pets",
    description:
      "Find your perfect Mini Dachshund puppy at Peaceful Country Pets. We offer Mini Dachshunds raised with love and care. Located in Sheridan, MI.",
    url: "https://www.prairiecreekpuppies.com/mini-dachshund-puppies",
    type: "website",
    images: [
      {
        url: "https://www.prairiecreekpuppies.com/assets/og/Mini-Dachshunds.jpg",
        width: 1200,
        height: 630,
        alt: "Mini Dachshund puppies at Peaceful Country Pets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mini Dachshund Puppies for Sale | Peaceful Country Pets",
    description:
      "Explore Peaceful Country Pets for high-quality Mini Dachshund puppies. We offer adorable Mini Dachshunds. Reserve your puppy today!",
    images: [
      "https://www.prairiecreekpuppies.com/assets/og/Mini-Dachshunds.jpg",
    ],
  },
};

export default async function MiniDachshunds() {
  let puppies = await getPuppies();

  puppies = puppies.filter((puppy) => puppy.breed[0] === "Mini Dachshund");

  const headerData = {
    header: "Mini Dachshund Puppies",
    subheader: "Adorable Mini Dachshunds Available",
    alt: "A Mini Dachshund puppy for sale in Sheridan MI",
    image: {
      lg: "/assets/breeds/mini-dachshunds/md-banner-bg-d",
      sm: "/assets/breeds/mini-dachshunds/md-banner-bg-m",
    },
  };

  const noResultsCopy = {
    header: "Oops! Our Mini Dachshund pack is resting",
    subheader:
      "We don't have any Mini Dachshund puppies available right now, but new litters are on the way!",
    p: "Want to be the first to know when our next bundle of Mini Dachshund joy arrives?",
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
      <BreedInfo breed={"Mini Dachshund"} />
      <div className={styles.anchor} id="subscribe"></div>
      <Subscribe interests={["Mini Dachshund"]} />
    </article>
  );
}
