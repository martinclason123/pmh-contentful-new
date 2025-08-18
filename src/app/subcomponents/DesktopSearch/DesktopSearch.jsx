"use client";

import styles from "./desktop-search.module.css";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function DesktopSearch({
  setOverlay,
  availableBreeds,
  puppies,
}) {
  const [focus, setFocus] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredPuppies, setFilteredPuppies] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);

  // Reference to the search component
  const formRef = useRef(null);

  // Effect to handle clicks outside the search component
  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setFocus(false);
        setOverlay(false);
        setFilteredPuppies([]);
        setFilteredBreeds([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [formRef]);

  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredPuppies([]);
      setFilteredBreeds([]);
      return;
    }

    // Filter puppies based on inputValue
    const filteredPups = puppies.filter((puppy) =>
      puppy.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    // Filter breeds based on inputValue
    const filteredBrds = availableBreeds.filter((breed) =>
      breed.message.toLowerCase().includes(inputValue.toLowerCase())
    );

    setFilteredPuppies(filteredPups);
    setFilteredBreeds(filteredBrds);
  }, [inputValue, puppies, availableBreeds]);

  // Handler to close overlay and search bar when an option is clicked
  const handleOptionClick = () => {
    setFocus(false);
    setOverlay(false);
    setInputValue("");
    setFilteredPuppies([]);
    setFilteredBreeds([]);
  };

  return (
    <form
      ref={formRef}
      className={`${styles.search} ${focus && styles.focused}`}
    >
      <div className={styles.search_box}>
        <input
          className={styles.search_input}
          type="text"
          id="desktopSearch"
          placeholder="Search for puppy or breed"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setFocus(true);
            setOverlay(true);
          }}
        />
        <label className="visually-hidden" htmlFor="desktopSearch">
          Search
        </label>
        <button type="submit" className={styles.submit}>
          <img
            src="/assets/navbar/search.svg"
            alt="Search Icon"
            className={styles.search_icon}
          />
        </button>
      </div>
      {(filteredPuppies.length > 0 || filteredBreeds.length > 0) && (
        <div className={styles.dropdown}>
          {filteredPuppies.map((puppy) => (
            <Link
              href={`/puppies/${puppy.chip}`}
              key={puppy.chip}
              className={styles.dropdown_item}
              onClick={handleOptionClick}
            >
              {puppy.name} - {puppy.breed[0]}
            </Link>
          ))}
          {filteredBreeds.map((breed) => (
            <Link
              href={breed.link}
              key={breed.message}
              className={styles.dropdown_item}
              onClick={handleOptionClick}
            >
              {breed.message.split(" - ")[0]} - View All
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
