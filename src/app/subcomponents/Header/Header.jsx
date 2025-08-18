import styles from "./header.module.css";

export default function Header({ data }) {
  const { image, header, subheader, alt } = data;

  return (
    <header className={styles.header}>
      <picture>
        <source
          srcSet={`${image.sm}.avif?$staticlink$`}
          type="image/avif"
          media="(max-width: 640px)"
          width="640"
          height="202"
        />
        <source
          srcSet={`${image.sm}.webp?$staticlink$`}
          type="image/webp"
          media="(max-width: 640px)"
          width="640"
          height="202"
        />
        <source
          srcSet={`${image.sm}.jpg?$staticlink$`}
          type="image/jpeg"
          media="(max-width: 640px)"
          width="640"
          height="202"
        />
        <source
          srcSet={`${image.lg}.avif?$staticlink$`}
          type="image/avif"
          media="(min-width: 641px)"
          width="1920"
          height="605"
        />
        <source
          srcSet={`${image.lg}.webp?$staticlink$`}
          type="image/webp"
          media="(min-width: 641px)"
          width="1920"
          height="605"
        />
        <img
          src={`${image.lg}.jpg?$staticlink$`}
          width="1920"
          height="605"
          alt={alt}
        />
      </picture>
      <div className={styles.overlay}>
        <div className={styles.copy}>
          <h1 className={styles.title}>{header}</h1>
          <h2 className={styles.subtitle}>{subheader}</h2>
        </div>
      </div>
    </header>
  );
}
