"use client";
import { useEffect, useState } from "react";
import { Mailchimp } from "../../app/subcomponents";
import styles from "./popup.module.css";

export default function Popup() {
  const [visible, setVisible] = useState(false);
  const interests = ["General"];

  useEffect(() => {
    // Check if the cookie exists
    const popupShown = document.cookie
      .split("; ")
      .find((row) => row.startsWith("popupShown="));

    if (!popupShown) {
      // If the cookie does not exist, show the popup after 5 seconds
      const timer = setTimeout(() => {
        setVisible(true);
      }, 5000);

      return () => clearTimeout(timer); // Clean up the timer on component unmount
    }
  }, []);

  const handleClose = () => {
    // Set a cookie to expire in 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    document.cookie = `popupShown=true; expires=${expiryDate.toUTCString()}; path=/`;

    setVisible(false);
  };

  return (
    <div
      className={`container ${styles.overlay} ${visible ? "" : styles.hidden}`}
    >
      <div className={styles.popupContent}>
        <button className={styles.close} onClick={handleClose}>
          X
        </button>

        <h2 className={styles.header}>Subscribe to Our Newsletter</h2>
        <p className={styles.copy}>
          Be the first to hear about upcoming litters, see updated puppy photos,
          and more!
        </p>
        <Mailchimp interests={interests} callback={handleClose}/>
        <p className={styles.decline} onClick={handleClose}>
          No thanks
        </p>
      </div>
    </div>
  );
}
