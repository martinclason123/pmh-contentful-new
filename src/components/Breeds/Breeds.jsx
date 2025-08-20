import styles from "./breeds.module.css";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const breeds = [
  {
    name: "Cavapoos",
    image: "/assets/breeds/cavapoo/cavapoo",
    highlight: "Playful, affectionate, and low-shedding",
    href: "/cavapoo-puppies",
  },
  {
    name: "Cavaliers",
    image: "/assets/breeds/cavalier/cavalier",
    highlight: "Gentle lap dogs with endless love",
    href: "/cavalier-puppies",
  },
  {
    name: "Bernedoodles",
    image: "/assets/breeds/mini-bernedoodles/mini-bernedoodle",
    highlight: "Intelligent, loyal, and family-friendly",
    href: "/mini-bernedoodle-puppies",
  },
];

export default function Breeds() {
  return (
    <section className={`container medium ${styles.breedSection}`}>
      <h2 className={styles.title}>Featured Breeds</h2>
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
