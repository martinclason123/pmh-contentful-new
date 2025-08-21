import styles from "./about.module.css";
import { Contact } from "../../components";

export const metadata = {
  title:
    "About Us | Paw Prints on My Heart - Ethical Breeders of Cavaliers, Cavapoos, Goldendoodles & Bernedoodles",
  description:
    "Learn more about Paw Prints on My Heart, a family-owned breeder in Sheridan, MI. Discover our ethical breeding practices and commitment to raising healthy, well-socialized Cavaliers, Cavapoos, Goldendoodles, and Bernedoodles.",
  openGraph: {
    title:
      "About Us | Paw Prints on My Heart - Ethical Breeders of Cavaliers, Cavapoos, Goldendoodles & Bernedoodles",
    description:
      "Discover the story behind Paw Prints on My Heart, a trusted Sheridan, MI breeder of Cavaliers, Cavapoos, Goldendoodles, and Bernedoodles. Learn about our ethical breeding practices and family values.",
    url: "https://www.pmhpuppies.com/about",
    type: "website",
    images: [
      {
        url: "https://www.pmhpuppies.com/assets/about/hero-d.jpg",
        width: 1920,
        height: 426,
        alt: "Paw Prints on My Heart - Ethical dog breeder facility",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "About Us | Paw Prints on My Heart - Ethical Breeders of Cavaliers, Cavapoos, Goldendoodles & Bernedoodles",
    description:
      "Learn about Paw Prints on My Heart in Sheridan, MI—our ethical breeding practices and dedication to healthy, well-socialized Cavaliers, Cavapoos, Goldendoodles, and Bernedoodles.",
    images: ["https://www.pmhpuppies.com/assets/about/hero-d.jpg"],
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
            alt="A collage of children and puppies"
          />
        </picture>
        <h1>About Us</h1>
      </header>
      <p className={styles.copy}>
        We, Richard and Wanita Martin, the dedicated and passionate breeders
        behind Paw Prints on My Heart, have been wholeheartedly committed to
        raising happy, healthy, and well-socialized puppies for over 10 years.
        Nestled on a beautiful 60-acre property in the picturesque countryside,
        our family-run facility is the perfect environment for puppies to grow
        and flourish.
      </p>
      <p className={styles.copy}>
        Each one of our puppies gets one-on-one attention daily to help them
        grow to be great members of society and to bring out the best of their
        personalities. Our puppies are all gently acclimated to crate time, they
        get to play with a variety of toys, and are introduced to many different
        surfaces, as well as multiple sounds, sights, and scents! Each puppy
        gets bathed & blow-dried every other week, to get them used to all the
        things that will be part of their future as an adult.
      </p>
      <p className={styles.copy}>
        The journey of Paw Prints On My Heart was born from both of us longing
        for our own dog as young children. As adults, owning our own dogs
        sparked a newfound passion for breeding and providing others with the
        joy of bringing home a happy, healthy puppy. Over the years, we have
        worked with multiple veterinarians & experienced breeders to carefully
        select healthy canines from specific breeds to ensure that we are able
        to offer you the healthiest puppy possible.
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
              alt="Dogs playing in a play area."
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
            alt="Children on a wagon holding puppies"
            className={styles.portrait}
          />
        </picture>
      </div>
      <p className={styles.copy}>
        {`Our mission has always been to help families find their perfect canine
        companion and connect with all the adoptive families as they bring home
        their new best friend. At the heart of Paw Prints On My Heart is a
        steadfast commitment to ethical breeding practices and the well-being of
        every dog and puppy under our care. We prioritize genetic health by
        conducting thorough screenings and maintaining detailed records of every
        puppy's lineage. We also work closely with local veterinarians to ensure
        each puppy receives proper vaccinations, health check-ups, deworming,
        and socialization.`}
      </p>
      <p className={styles.copy}>
        In addition to providing the best care possible, we also focus on
        education and offer resources to help new owners successfully integrate
        their furry friends into their homes. Our dedication to you and your new
        family member is unwavering, and the love we have for our dogs and
        puppies has helped many families create a lifetime of fond memories with
        their four-legged companions.
      </p>
      <Contact />
    </article>
  );
}
