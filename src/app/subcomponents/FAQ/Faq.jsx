import styles from "./faq.module.css";

export default function Faq({ data, breed }) {
  return (
    <section className={`container ${styles.faq}`}>
      {/* <h2 className={styles.sectionTitle}>Is a {breed} right for me?</h2> */}
      <div className={styles.cardGrid}>
        {data.map((item, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                {item.icon && <item.icon className={styles.icon} />}
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
        ))}
      </div>
    </section>
  );
}
