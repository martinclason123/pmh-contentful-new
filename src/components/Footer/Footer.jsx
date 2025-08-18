import Link from "next/link";
import styles from "./footer.module.css";
export default function Footer() {
  return (
    <footer className={`container ${styles.footer}`}>
      <nav className={styles.lists}>
        <ul>
          <li className={styles.links_header}>
            <img
              className={styles.icon}
              src="/assets/footer/location.svg"
              alt="location icon"
            />
          </li>
          <li>
            <p>
              Sheridan, MI. please contact us if you would like to stop by and
              we will send you our address.
            </p>
          </li>
        </ul>
        <ul>
          <li className={styles.links_header}>
            <img
              className={styles.icon}
              src="/assets/footer/phone.svg"
              alt="phone icon"
            />
          </li>
          <li>Monday-Saturday: 9am to 8pm</li>
          <li>
            <a href="tel:+16166136801">Call or text: (616) 613-6801</a>
          </li>
        </ul>
        <ul>
          <li className={styles.links_header}>
            <img
              className={styles.icon}
              src="/assets/footer/email.svg"
              alt="email icon"
            />
          </li>

          <li>
            <a href="mailto:hello@peacefulcountrypets.com">
              hello@peacefulcountrypets.com
            </a>
          </li>
        </ul>

        <ul>
          <li className={styles.links_header}>Follow Us!</li>
          <li>
            <a
              target="_blank"
              href="https://www.facebook.com/profile.php?id=61561863522481"
            >
              <img
                className={styles.socials}
                src="/assets/footer/facebook.svg"
                alt="Facebook icon"
              />
            </a>
          </li>
        </ul>
      </nav>
      <img
        src="/assets/footer/logo-white.svg"
        alt="prairie creek puppies logo"
        className={styles.logo}
        width={127}
        height={150}
      />
      <p
        className={styles.copyright}
      >{`${new Date().getFullYear()} Pixel Lab Co LLC, All Rights Reserved.`}</p>
    </footer>
  );
}
