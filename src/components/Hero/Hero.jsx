import styles from "./hero.module.css";
import Link from "next/link";

export default function Hero() {
  return (
    <section className={`container ${styles.hero}`}>
      <picture>
        <source
          srcset="/assets/hero/hero-m.avif?$staticlink$"
          type="image/avif"
          media="(max-width: 640px)"
          width="640"
          height="1100"
        />
        <source
          srcset="/assets/hero/hero-m.webp?$staticlink$"
          type="image/webp"
          media="(max-width: 640px)"
          width="640"
          height="1100"
        />
        <source
          srcset="/assets/hero/hero-m.jpg?$staticlink$"
          type="image/jpeg"
          media="(max-width: 640px)"
          width="640"
          height="1100"
        />
        <source
          srcset="/assets/hero/hero-d.avif?$staticlink$"
          type="image/avif"
          media="(min-width: 641px)"
          width="1920"
          height="700"
        />
        <source
          srcset="/assets/hero/hero-d.webp?$staticlink$"
          type="image/webp"
          media="(min-width: 641px)"
          width="1920"
          height="700"
        />
        <img
          src="/assets/hero/hero-d.jpg?$staticlink$"
          width="1920"
          height="700"
          alt="Puppies on a wagon"
        />
      </picture>
      <header className={styles.header}>
        <h1 className={styles.header_text}>Paw Prints on My Heart</h1>
        <Link href={"/puppies"} className={styles.cta}>
          <span className={styles.cta_text}>See Puppies</span>
        </Link>
      </header>
    </section>
  );
}
