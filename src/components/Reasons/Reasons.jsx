import styles from "./reasons.module.css";
export default function Reasons() {
  return (
    <section className={`container ${styles.reasons}`}>
      <h2 className={styles.header}>Why Choose Us?</h2>
      <div className={styles.cards}>
        <div className={styles.card}>
          <img
            className={styles.icon}
            src="/assets/reasons/akc.svg"
            alt="AKC Icon"
          />
          <p>
            {`Our purebred puppies are AKC certified, which guarantees your
            puppy's lineage has been carefully recorded and is part of the
            respected AKC registry. When you choose an AKC certified puppy,
            you know it is an ethically raised purebred.`}
          </p>
        </div>
        <div className={styles.card}>
          <img
            className={styles.icon}
            src="/assets/reasons/health.svg"
            alt="health Icon"
          />
          <p>{`We provide a 1-year health guarantee, ensuring your puppy is free from genetic health issues. If any genetic concerns arise within the first year, we will address them promptly, giving you peace of mind about your puppy’s health and future.`}</p>
        </div>
        <div className={styles.card}>
          <img
            className={styles.icon}
            src="/assets/reasons/heart.svg"
            alt="Heart icon"
          />
          <p>{`Our puppies are raised in a loving family environment, surrounded by children and other pets. This ensures they are well-socialized and accustomed to home life, making them friendly and well-adjusted companions for your family.`}</p>
        </div>
        <div className={styles.card}>
          <img
            className={styles.icon}
            src="/assets/reasons/dog.svg"
            alt="dog icon"
          />
          <p>{`We adhere to strict ethical breeding practices, prioritizing the health and well-being of our dogs. Our puppies come from healthy, well-cared-for parents, ensuring they receive the best start in life and are ready to become cherished family members.`}</p>
        </div>
      </div>
    </section>
  );
}
