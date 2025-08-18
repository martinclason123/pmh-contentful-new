import styles from "./filter.module.css";
import { Options } from "..";

export default function FilterMobile({
  open,
  handleFiltersClose,
  filters,
  setFilters,
  availableBreeds,
}) {
  return (
    <div className={`container ${styles.overlay} ${open ? styles.open : ""}`}>
      <div className={`${styles.slideout} ${open ? styles.openSlideout : ""}`}>
        <button className={styles.closeButton} onClick={handleFiltersClose}>
          X
        </button>
        <div className={styles.filterContent}>
          <Options
            filters={filters}
            setFilters={setFilters}
            handleFiltersClose={handleFiltersClose}
            availableBreeds={availableBreeds}
          />
        </div>
      </div>
    </div>
  );
}
