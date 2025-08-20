import styles from "./about.module.css";
import Link from "next/link";

export default function About() {
  return (
    <section className={`container ${styles.about}`}>
      <picture>
        <source
          srcSet="/assets/about/home-about-m.avif?$staticlink$"
          type="image/avif"
          media="(max-width: 640px)"
          width="640"
          height="481"
        />
        <source
          srcSet="/assets/about/home-about-m.webp?$staticlink$"
          type="image/webp"
          media="(max-width: 640px)"
          width="640"
          height="481"
        />
        <source
          srcSet="/assets/about/home-about-m.jpg?$staticlink$"
          type="image/jpeg"
          media="(max-width: 640px)"
          width="640"
          height="481"
        />
        <source
          srcSet="/assets/about/home-about-d.avif?$staticlink$"
          type="image/avif"
          media="(min-width: 641px)"
          width="800"
          height="1067"
        />
        <source
          srcSet="/assets/about/home-about-d.webp?$staticlink$"
          type="image/webp"
          media="(min-width: 641px)"
          width="800"
          height="1067"
        />
        <img
          src="/assets/about/home-about-d.jpg?$staticlink$"
          width="800"
          height="1067"
          alt="A golden retriever puppy for sale in Sheridan Michigan"
          className={styles.aboutImage}
        />
      </picture>
      <div className={styles.aboutText}>
        <h2>About Paw Prints on My Heart</h2>
        <p>
          We, Richard and Wanita Martin, the dedicated and passionate breeders
          behind Paw Prints on My Heart, have been wholeheartedly committed to
          raising happy, healthy, and well-socialized puppies for over 10 years.
          Nestled on a beautiful 60-acre property in the picturesque
          countryside, our family-run facility is the perfect environment for
          puppies to grow and flourish.
        </p>
        <p>
          {`Due to our Mennonite background, online communication and
          the management of this website are handled by Martin and Kara Clason,
          a trusted family from West Michigan.`}
        </p>
        <Link href="/about" className={styles.learnMore}>
          {`Click here to learn more about us >`}
        </Link>
      </div>
    </section>
  );
}
