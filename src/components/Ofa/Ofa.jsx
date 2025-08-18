import styles from "./ofa.module.css";

const Ofa = ({ list = [], callback }) => {
  console.log("list: ", list);
  return (
    <div>
      <p className={styles.header}>OFA Testing:</p>
      <ul className={styles.ofaList}>
        {list.map((item, index) => (
          <li key={index} className={styles.ofaItem}>
            {item}
          </li>
        ))}
      </ul>
      <button
        className={styles.certsLinks}
        onClick={() => {
          callback();
        }}
      >
        <span>See Certifications</span> 📜
      </button>
    </div>
  );
};

export default Ofa;
