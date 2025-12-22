"use client";
import styles from "./accordian.module.scss";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Accordian({ items = [] }) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState(-1);

  const toggle = (idx) => setOpenIndex((prev) => (prev === idx ? -1 : idx));

  return (
    <div className={styles.accordian}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        const buttonId = `${baseId}-btn-${idx}`;
        const panelId = `${baseId}-panel-${idx}`;

        return (
          <div
            key={idx}
            className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
          >
            <button
              id={buttonId}
              type="button"
              className={`${styles.title} ${isOpen ? styles.titleOpen : ""}`}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(idx)}
            >
              <span className={styles.titleText}>{item.title}</span>
              <ChevronDown
                className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                aria-hidden="true"
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`${styles.content} ${isOpen ? styles.contentOpen : ""}`}
            >
              <div className={styles.contentInner}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
