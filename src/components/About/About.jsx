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
          srcSet="/assets/about/home-about-d-sm.avif?$staticlink$"
          type="image/avif"
          media="(min-width: 641px)"
          width="800"
          height="1067"
        />
        <source
          srcSet="/assets/about/home-about-d-sm.webp?$staticlink$"
          type="image/webp"
          media="(min-width: 641px)"
          width="800"
          height="1067"
        />
        <img
          src="/assets/about/home-about-d-sm.jpg?$staticlink$"
          width="800"
          height="1067"
          alt="A golden retriever puppy for sale in Sheridan Michigan"
          className={styles.aboutImage}
        />
      </picture>
      <div className={styles.aboutText}>
        <h2>About Peaceful Country Pets</h2>
        <p>
        Peaceful Country Pets is proudly owned by Dennis and Lois-Anne Martin, located
          in Sheridan, Michigan. With over 10 years of experience in breeding
          high-quality puppies, the Martins are dedicated to ensuring their
          puppies receive the best care and find loving, forever homes. Raised
          in a clean, temperature-controlled environment, every puppy is given
          the attention and care they need to thrive.
        </p>
        <p>
          {`Due to the breeders' Mennonite background, online communication and
          the management of this website are handled by Martin and Kara Clason,
          a trusted family from West Michigan. We work closely with reputable
          Mennonite breeders in the Sheridan area to help puppies find good homes.`}
        </p>
        <Link href="/about" className={styles.learnMore}>
          {`Click here to learn more about us >`}
        </Link>
      </div>
    </section>
  );
}
