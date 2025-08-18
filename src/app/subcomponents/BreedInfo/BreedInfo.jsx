import styles from "./breed-info.module.css";
import getBreedInfo from "../../../utils/get-breed-info";
import {
  Scissors,
  Ruler,
  Heart,
  Dumbbell,
  GraduationCap,
  Stethoscope,
  Clock,
  Droplets,
} from "lucide-react";

const iconComponents = {
  Scissors: Scissors,
  Ruler: Ruler,
  Heart: Heart,
  Dumbbell: Dumbbell,
  GraduationCap: GraduationCap,
  Stethoscope: Stethoscope,
  Clock: Clock,
  Droplets: Droplets,
};

export default function BreedInfo({ breed, modifiers }) {
  const breedInfo = getBreedInfo(breed);

  // Extract intro and faq data from the breedInfo
  const { intro, faq } = breedInfo;

  return (
    <>
      {/* Intro Section */}
      <section className={`${styles.intro} ${modifiers}`}>
        <h2 className={styles.title}>Breed Info</h2>
        <div className={styles.content}>
          <picture>
            <source
              srcSet={`${intro.image}.avif`}
              type="image/avif"
              media="(min-width: 641px)"
              width="200"
              height="200"
            />
            <source
              srcSet={`${intro.image}.webp`}
              type="image/webp"
              media="(min-width: 641px)"
              width="200"
              height="200"
            />
            <img
              src={`${intro.image}.png`}
              width="200"
              height="200"
              alt={intro.alt}
              className={styles.sketch}
            />
          </picture>
          <p className={styles.copy}>{intro.copy}</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`container ${styles.faq}`}>
        <div className={styles.cardGrid}>
          {faq.map((item, index) => {
            const IconComponent = iconComponents[item.icon];
            return (
              <div key={index} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    {IconComponent && <IconComponent className={styles.icon} />}
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.category}>{item.category}</p>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <p>{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
