import styles from "./options.module.css";

export default function Options() {
  return (
    <section className={`container ${styles.options}`}>
      <div className={styles.cards}>
        <h2 className={styles.cards__header}>We Accept</h2>
        <div className={styles.icons}>
          <img src="/assets/options/Visa_hetpsp.svg" alt="Visa" />
          <img src="/assets/options/Mastercard_zs0j47.svg" alt="Mastercard" />
          <img src="/assets/options/Amex_lwuukt.svg" alt="Emerican Express" />
          <img src="/assets/options/discover_ctgryg.svg" alt="Discover" />
        </div>
      </div>
      <div className={styles.cards}>
        <h2 className={styles.cards__header}>Finance Your Puppy</h2>
        <div className={styles.icons}>
          <img src="/assets/options/Klarna_cjwl4p.svg" alt="Klarna" />
        </div>
      </div>
    </section>
  );
}
