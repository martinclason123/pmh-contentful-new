import Link from "next/link";
import styles from "./no-results.module.css";
export default function NoResults({ copy }) {
  const { header, subheader, p, cta, link } = copy;
  return (
    <div className={`container ${styles.NoResults}`}>
      <img
        className={styles.icon}
        src="/assets/litters/sniffing-dog.svg"
        alt="dog sniffing around"
      />
      <h3 className={styles.header}>{header}</h3>
      <h4 className={styles.suheader}>{subheader}</h4>
      <p className={styles.p}>{p}</p>
      <Link className={styles.cta} href={link}>
        {cta}
      </Link>
    </div>
  );
}
