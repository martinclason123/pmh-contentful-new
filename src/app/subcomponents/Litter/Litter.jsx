import Link from "next/link";
import styles from "./litter.module.css";

export default function Litter({ litter }) {
  if (!litter) return null;

  const { breed, message, hero, id } = litter; // hero is now coming from the API
  const url = `/litters/${id}`;

  return (
    <div className={styles.litter_wrapper}>
      <div className={styles.litter}>
        <div className={styles.litter_content}>
          <h2>{breed}</h2>
          <img
            src={hero} // Dynamic URL from API
            width="1920"
            height="1351"
            loading="lazy"
            alt={`A group of ${breed} puppies sitting in a row`}
            className={styles.litter_image} // Optionally add a class for styling
          />
          <p>{message}</p>
          <Link href={url} className={styles.cta}>
            <span className={styles.cta_text}>Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
