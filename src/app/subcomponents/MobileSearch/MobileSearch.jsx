"use client";

import styles from "./mobile-search.module.css";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function MobileSearch({ availableBreeds, puppies }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredPuppies, setFilteredPuppies] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const inputRef = useRef(null);

  // Focus the input when modal opens
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModalOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isModalOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        closeModal();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  // Reference to the modal
  const modalRef = useRef(null);

  const openModal = () => {
    setIsModalOpen(true);
    setInputValue("");
    setFilteredPuppies([]);
    setFilteredBreeds([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setInputValue("");
    setFilteredPuppies([]);
    setFilteredBreeds([]);
  };

  // Handle input changes and filter results
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

  return (
    <>
      {/* Search Icon */}
      <div className={styles.mobile_nav} onClick={openModal}>
        <img
          src="/assets/navbar/search.svg"
          alt="Search Icon"
          className={styles.search_icon}
        />
      </div>

      {/* Full-screen Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} ref={modalRef}>
            {/* Close Icon */}
            <img
              src="/assets/navbar/x.svg"
              alt="Close"
              className={styles.closeIcon}
              onClick={closeModal}
            />

            {/* Search Bar */}
            <div className={styles.searchContainer}>
              <div className={styles.inputWrapper}>
                <input
                  ref={inputRef}
                  className={styles.search_input}
                  type="text"
                  placeholder="Search for puppy or breed"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            </div>

            {/* Predictive Search Results */}
            {(filteredPuppies.length > 0 || filteredBreeds.length > 0) && (
              <div className={styles.dropdown}>
                {filteredPuppies.map((puppy) => (
                  <Link
                    href={`/puppies/${puppy.chip}`}
                    key={puppy.chip}
                    className={styles.dropdown_item}
                    onClick={closeModal}
                  >
                    {puppy.name} - {puppy.breed[0]}
                  </Link>
                ))}
                {filteredBreeds.map((breed) => (
                  <Link
                    href={breed.link}
                    key={breed.message}
                    className={styles.dropdown_item}
                    onClick={closeModal}
                  >
                    {breed.message.split(" - ")[0]} - View All
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
