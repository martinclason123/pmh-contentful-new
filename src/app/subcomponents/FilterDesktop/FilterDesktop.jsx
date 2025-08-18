import styles from "./filter.module.css";
import { Options } from "..";

export default function FilterDesktop({
  filters,
  setFilters,
  availableBreeds,
}) {
  return (
    <section className={`container ${styles.filter}`}>
      <Options
        filters={filters}
        setFilters={setFilters}
        availableBreeds={availableBreeds}
      />
    </section>
  );
}
