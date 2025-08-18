import styles from "./socials.module.css";
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

export default function Socials() {
  return (
    <section className={`container ${styles.socials}`}>
      <h2 className={styles.title}>Follow Us</h2>
      <div className={styles.iconContainer}>
        <a
          href="https://www.facebook.com/profile.php?id=61561863522481"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.iconLink}
        >
          <FaFacebook className={styles.icon} />
        </a>
        <a
          href="https://www.instagram.com/prairiecreekpuppies/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.iconLink}
        >
          <FaInstagram className={styles.icon} />
        </a>
        <a
          href="https://www.tiktok.com/@prairie.creek.pup?_t=8pp4meTR6fm&_r=1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.iconLink}
        >
          <FaTiktok className={styles.icon} />
        </a>
        <a
          href="https://www.youtube.com/@PrairieCreekPuppies-l5n"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.iconLink}
        >
          <FaYoutube className={styles.icon} />
        </a>
      </div>
    </section>
  );
}
