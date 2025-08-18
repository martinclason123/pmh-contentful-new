"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Gallery, FilterMobile, FilterDesktop } from "../../app/subcomponents";
import styles from "./puppies.module.css";
import { Subscribe } from "..";

export default function PuppiesGallery({ puppies, breedParam }) {
  const [filters, setFilters] = useState({
    gender: [],
    breed: breedParam ? [breedParam] : [],
  });

  const [menuOpen, setMenuOpen] = useState(false);

  const handleFiltersOpen = () => {
    document.body.style.overflow = "hidden";
    setMenuOpen(true);
  };

  const handleFiltersClose = () => {
    document.body.style.overflow = "visible";
    setMenuOpen(false);
  };

  useEffect(() => {
    if (breedParam) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        breed: [breedParam],
      }));
    }
  }, [breedParam]);

  // Filtering logic
  const filteredPuppies = puppies.filter((puppy) => {
    const matchesGender =
      filters.gender.length === 0 || filters.gender.includes(puppy.gender[0]);
    const matchesBreed =
      filters.breed.length === 0 || filters.breed.includes(puppy.breed[0]);

    return matchesGender && matchesBreed;
  });

  // Get available breeds dynamically from the puppy data
  const availableBreeds = [...new Set(puppies.map((puppy) => puppy.breed[0]))];

  return (
    <>
      {menuOpen && (
        <FilterMobile
          open={menuOpen}
          handleFiltersClose={handleFiltersClose}
          filters={filters}
          setFilters={setFilters}
          availableBreeds={availableBreeds} // Pass available breeds down
        />
      )}

      <section className={`container ${styles.puppies}`}>
        <h1>All Puppies</h1>

        <FilterDesktop
          open={menuOpen}
          handleFiltersClose={handleFiltersClose}
          filters={filters}
          setFilters={setFilters}
          availableBreeds={availableBreeds} // Pass available breeds down
        />

        <button className={styles.button} onClick={handleFiltersOpen}>
          <span>Filters</span>
        </button>

        {filteredPuppies.length > 0 ? (
          <Gallery puppies={filteredPuppies} />
        ) : (
          <div className={styles.noMatches}>
            <p>No matches for your filters.</p>
            <p>
              Looking for something else? Subscribe below to be the first to
              hear about new litters and other exciting updates.
            </p>
          </div>
        )}

        <Link href={"/"} className={styles.cta}>
          <span className={styles.cta_text}>Home</span>
        </Link>

        <Subscribe interests={"General"} noPuppies={false} />
      </section>
    </>
  );
}
