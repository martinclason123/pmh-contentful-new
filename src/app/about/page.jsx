import styles from "./about.module.css";
import { Contact } from "../../components";

export const metadata = {
  title:
    "About Us | Peaceful Country Pets - Ethical Breeders of AKC Golden Retrievers, Goldendoodles, & Mini Goldendoodles",
  description:
    "Learn more about Peaceful Country Pets, a family-owned dog breeding kennel located in Sheridan, MI. Discover our ethical breeding practices, our commitment to the health and well-being of our puppies, and meet the Martin family.",
  openGraph: {
    title:
      "About Us | Peaceful Country Pets - Ethical Breeders of AKC Golden Retrievers, Goldendoodles, & Mini Goldendoodles",
    description:
      "Discover the story behind Peaceful Country Pets, a trusted breeder of AKC Golden Retrievers, Goldendoodles, and Mini Goldendoodles. Meet the Martin family and learn about our ethical breeding practices.",
    url: "https://www.prairiecreekpuppies.com/about",
    type: "website",
    images: [
      {
        url: "https://www.prairiecreekpuppies.com/assets/about/hero-d.jpg",
        width: 1920,
        height: 426,
        alt: "Peaceful Country Pets - Ethical Dog Breeder Facility",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "About Us | Peaceful Country Pets - Ethical Breeders of AKC Golden Retrievers, Goldendoodles, & Mini Goldendoodles",
    description:
      "Learn more about Peaceful Country Pets, a family-owned dog breeding kennel located in Sheridan, MI. Discover our ethical breeding practices, our commitment to the health and well-being of our puppies, and meet the Martin family.",
    images: ["https://www.prairiecreekpuppies.com/assets/about/hero-d.jpg"],
  },
};

export default function About() {
  return (
    <article className={`container ${styles.about}`}>
      <header className={styles.header}>
        <picture>
          <source
            srcSet="/assets/about/hero-m.avif"
            type="image/avif"
            media="(max-width: 640px)"
            width="640"
            height="142"
          />
          <source
            srcSet="/assets/about/hero-m.webp"
            type="image/webp"
            media="(max-width: 640px)"
            width="640"
            height="142"
          />
          <source
            srcSet="/assets/about/hero-m.jpg"
            type="image/jpeg"
            media="(max-width: 640px)"
            width="640"
            height="142"
          />
          <source
            srcSet="/assets/about/hero-d.avif"
            type="image/avif"
            media="(min-width: 641px)"
            width="1920"
            height="426"
          />
          <source
            srcSet="/assets/about/hero-d.webp"
            type="image/webp"
            media="(min-width: 641px)"
            width="1920"
            height="426"
          />
          <img
            src="/assets/about/hero-d.jpg"
            width="1920"
            height="426"
            alt="An ethical dog breeder facility"
          />
        </picture>
        <h1>About Us</h1>
      </header>
      <p className={styles.copy}>
        Peaceful Country Pets is a dog breeding kennel located on a family farm
        owned and operated by Dennis and Lois-Anne Martin, a Mennonite family in
        Sheridan, MI. The Martin family has over 10 years of experience breeding
        AKC Golden Retrievers, Shih Tzus and more. The Martins adhere to ethical
        breeding practices to ensure the health and well-being of their puppies.
      </p>
      <div className={styles.cards}>
        <div className={styles.card}>
          <picture>
            <source
              srcSet="/assets/about/puppy.avif"
              type="image/avif"
              width="500"
              height="500"
            />
            <source
              srcSet="/assets/about/puppy.webp"
              type="image/webp"
              width="500"
              height="500"
            />
            <img
              src="/assets/about/puppy.jpg"
              width="500"
              height="500"
              loading="lazy"
              alt="a Golden Retriever puppy sitting on a chair"
            />
          </picture>
          <p className={styles.subcopy}>
            Each puppy is vet-checked, vaccinated, dewormed, and comes with a
            health guarantee.
          </p>
        </div>
        <div className={styles.card}>
          <picture>
            <source
              srcSet="/assets/about/micaw.avif"
              type="image/avif"
              width="500"
              height="500"
            />
            <source
              srcSet="/assets/about/micaw.webp"
              type="image/webp"
              width="500"
              height="500"
            />
            <img
              src="/assets/about/micaw.jpg"
              width="500"
              height="500"
              loading="lazy"
              alt="MICAW logo"
            />
          </picture>
          <p className={styles.subcopy}>
            The Martins are proud members of MICAW, an organization that
            educates breeders on ethical and safe breeding practices.
          </p>
        </div>
        <div className={styles.card}>
          <picture>
            <source
              srcSet="/assets/about/kennel.avif"
              type="image/avif"
              width="500"
              height="500"
            />
            <source
              srcSet="/assets/about/kennel.webp"
              type="image/webp"
              width="500"
              height="500"
            />
            <img
              src="/assets/about/kennel.jpg"
              width="500"
              height="500"
              loading="lazy"
              alt="A puppy breeding kennel"
            />
          </picture>
          <p className={styles.subcopy}>
            All puppies bred by the Martins are raised in a safe, clean, and
            temperature-controlled environment.
          </p>
        </div>
      </div>
      <div className={styles.family}>
        <picture>
          <source
            srcSet="/assets/about/family.avif"
            type="image/avif"
            width="2048"
            height="1598"
          />
          <source
            srcSet="/assets/about/family.webp"
            type="image/webp"
            width="2048"
            height="1598"
          />
          <img
            src="/assets/about/family.jpg"
            width="2048"
            height="1598"
            loading="lazy"
            alt="A picture of a family"
            className={styles.portrait}
          />
        </picture>
        <p className={styles.copy}>
          Kara and Martin manage the photography, social media, visits, and
          website on behalf of the Martins. They facilitate all communication
          between customers and the Martins. Living locally, Martin, Kara, and
          their family enjoy coming out with their kids to take photos and play
          with the puppies. Kara loves getting to know people and helping the
          puppies find their perfect homes.
        </p>
      </div>
      <Contact />
    </article>
  );
}
