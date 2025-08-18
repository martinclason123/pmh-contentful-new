import styles from "./intro.module.css";

export default function Intro({ data }) {
  const { image, copy, alt } = data;
  return (
    <div>
      <section className={styles.intro}>
        <h2 className={styles.title}>Breed Info</h2>

        <div className={styles.content}>
          <picture>
            <source
              srcSet={`${image}.avif?$staticlink$`}
              type="image/avif"
              media="(min-width: 641px)"
              width="200"
              height="200"
            />
            <source
              srcSet={`${image}.webp?$staticlink$`}
              type="image/webp"
              media="(min-width: 641px)"
              width="200"
              height="200"
            />
            <img
              src={`${image}.png?$staticlink$`}
              width="200"
              height="200"
              alt={alt}
              className={styles.icon}
            />
          </picture>
          <p className={styles.copy}>{copy}</p>
        </div>
      </section>
    </div>
  );
}
