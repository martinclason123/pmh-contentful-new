import styles from "./options.module.css";

export default function Options({
  filters,
  setFilters,
  handleFiltersClose,
  availableBreeds, // Receive the dynamic list of available breeds
}) {
  const handleFilterChange = (category, option) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [category]: prevFilters[category].includes(option)
        ? prevFilters[category].filter((item) => item !== option)
        : [...prevFilters[category], option],
    }));
  };

  return (
    <div className={styles.optionsContainer}>
      <div className={styles.filterActions}>
        <button onClick={() => setFilters({ gender: [], breed: [] })}>
          Clear filters
        </button>
        <span>|</span>
        <button onClick={() => handleFiltersClose()}>Done</button>
      </div>
      <div className={`${styles.filterGroup} ${styles.desktopActions}`}>
        <img
          alt="filter"
          src={"./assets/puppies/filters-02.svg"}
          className={styles.filterIcon}
        />
      </div>

      <div className={styles.filterGroup}>
        <h3>Gender</h3>
        <div className={styles.filterOptions}>
          {["male", "female"].map((gender) => (
            <label key={gender} className={styles.optionLabel}>
              <input
                type="checkbox"
                checked={filters.gender.includes(gender)}
                onChange={() => handleFilterChange("gender", gender)}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.optionName}>{gender}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={`${styles.filterGroup} ${styles.border}`}>
        <h3>Breed</h3>
        <div className={styles.filterOptions}>
          {availableBreeds.map((breed) => (
            <label key={breed} className={styles.optionLabel}>
              <input
                type="checkbox"
                checked={filters.breed.includes(breed)}
                onChange={() => handleFilterChange("breed", breed)}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.optionName}>{breed}</span>
            </label>
          ))}
        </div>
      </div>

      <div
        className={`${styles.filterGroup} ${styles.border} ${styles.desktopActions}`}
      >
        <button
          className={styles.desktopClear}
          onClick={() => setFilters({ gender: [], breed: [] })}
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
