import Link from "next/link";
import styles from "./gallery.module.css";
import { ResponsiveImage } from "../../../components";

export default function Gallery({ puppies, fullWidth = true }) {
  return (
    <div className={`${styles.gallery} ${!fullWidth && styles.small}`}>
      <div className={styles.cards}>
        {puppies.map((puppy, index) => {
          const available = puppy.availability[0] === "Available";
          return (
            <Link
              href={`/puppies/${puppy.chip}`}
              key={index}
              className={styles.card}
            >
              <div className={styles.image_wrapper}>
                <ResponsiveImage
                  src={puppy.hero}
                  alt={`${puppy.breed} puppy`}
                />

                {!available ? (
                  <div className={styles.availability}>
                    <h2 className={styles.status}>{puppy.availability} 💖</h2>
                  </div>
                ) : null}
              </div>
              <p className={styles.name}>{`${
                puppy.name
              } (${puppy.gender[0].slice(0, 1)})`}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
