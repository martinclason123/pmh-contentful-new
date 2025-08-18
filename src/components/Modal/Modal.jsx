"use client";
import { useEffect } from "react";
import styles from "./modal.module.css";

export default function Modal({ open, close, children }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") close();
    };

    // ✅ Lock scroll when modal opens
    if (open) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = ""; // ✅ Restore scroll
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div id={styles.modal} className="modal">
      <button className={styles.close} onClick={close}>
        X
      </button>
      <div className={styles.modalContent}>{children}</div>
    </div>
  );
}
