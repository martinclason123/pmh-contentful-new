import styles from "./location.module.css";
export default function Location() {
  return (
    <section id="location" className={`container ${styles.Location}`}>
      <picture>
        <source
          srcset="/assets/location/map-m.avif?$staticlink$"
          type="image/avif"
          media="(max-width: 640px)"
          width="640"
          height="450"
        />
        <source
          srcset="/assets/location/map-m.webp?$staticlink$"
          type="image/webp"
          media="(max-width: 640px)"
          width="640"
          height="450"
        />
        <source
          srcset="/assets/location/map-m.jpg?$staticlink$"
          type="image/jpeg"
          media="(max-width: 640px)"
          width="640"
          height="450"
        />
        <source
          srcset="/assets/location/map-d.avif?$staticlink$"
          type="image/avif"
          media="(min-width: 641px)"
          width="1920"
          height="600"
        />
        <source
          srcset="/assets/location/map-d.webp?$staticlink$"
          type="image/webp"
          media="(min-width: 641px)"
          width="1920"
          height="600"
        />
        <img
          src="/assets/location/map-d.jpg?$staticlink$"
          width="1920"
          height="600"
          loading="lazy"
          alt="a map of a city"
        />
      </picture>

      <div className={styles.information}>
        <h2>
          <img
            className={styles.icon}
            src="/assets/location/location.svg"
            alt="map pin"
          />
          Sheridan, MI
        </h2>
        <p>
          Please contact us if you would like to stop by and we will send you
          our address.
        </p>
        <div className={styles.list}>
          <img
            src="/assets/location/phone.svg"
            alt=""
            className={styles.list__header}
          />
          <ul>
            <li>Monday-Saturday: 9am to 8pm</li>
            <li>
              <a href="tel:+16166136801">Text or Call: (616) 613-6801</a>
            </li>
          </ul>
        </div>
        <div className={styles.list}>
          <img
            src="/assets/location/email.svg"
            alt=""
            className={styles.list__header}
          />
          <ul>
            <li>
              <a href="mailto:hello@pmhpuppies.com">
                Email: hello@pmhpuppies.com
              </a>
            </li>
            <li>
              Message us on&nbsp;
              <a
                className={styles.link}
                href="https://www.facebook.com/profile.php?id=100091205476392"
                target="_blank"
              >
                Facebook
              </a>
            </li>
            <li>
              Or use our&nbsp;
              <a className={styles.link} href="/#form">
                form
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
