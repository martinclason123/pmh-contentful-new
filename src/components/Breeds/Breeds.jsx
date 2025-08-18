import styles from "./breeds.module.css";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const breeds = [
  {
    name: "Golden Retrievers",
    image: "/assets/breeds/golden-retrievers/golden-retriever",
    highlight: "Friendly and great with children",
    href: "/golden-retriever-puppies",
  },
  {
    name: "Shih Tzus",
    image: "/assets/breeds/shih-tzus/shih-tzu",
    highlight: "Perfect for cozy companionship",
    href: "/shih-tzu-puppies",
  },
  {
    name: "Mini Dachshund",
    image: "/assets/breeds/mini-dachshunds/dachshund",
    highlight: "Loyal and great for limited space",
    href: "/mini-dachshund-puppies",
  },
];

export default function Breeds() {
  return (
    <section className={`container medium ${styles.breedSection}`}>
      <h2 className={styles.title}>Our Breeds</h2>
      <div className={styles.breedsGallery}>
        {breeds.map(({ name, image, highlight, href }) => (
          <Link key={name} className={styles.breedCard} href={href}>
            <div className={styles.imageWrapper}>
              <img
                alt={`${name} for sale in Sheridan MI`}
                src={`${image}.png`}
                className={styles.breedImage}
              />
            </div>
            <div className={styles.copy}>
              <h3 className={styles.breedName}>{name}</h3>
              <p className={styles.breedHighlight}>{highlight}</p>
            </div>
            <ArrowRight className={styles.arrowIcon} />
          </Link>
        ))}
      </div>
    </section>
  );
}
