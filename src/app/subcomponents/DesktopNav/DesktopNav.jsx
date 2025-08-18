"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./desktop-nav.module.css";
import { DesktopSearch } from "..";

export default function DesktopNav({ menuItems, availableBreeds, puppies }) {
  const [overlay, setOverlay] = useState(false);

  return (
    <>
      <nav className={`${styles.navbar} container`}>
        <div
          className={`${styles.overlay} ${overlay && styles.overlay_visible}`}
        ></div>
        <div className={styles.nav_items_left}>
          <Link href={"/"}>
            <img
              src="/assets/navbar/logo.svg"
              alt="prairie creek puppies logo"
              width={127}
              height={150}
              className={styles.logo}
            />
          </Link>
          <div className={styles.nav_links}>
            {menuItems.map((item) =>
              item.link ? (
                <Link
                  className={styles.link_title}
                  href={item.link}
                  key={item.title}
                >
                  <span className={styles.link_text}>{item.title}</span>
                </Link>
              ) : (
                <div className={styles.link_title} key={item.title}>
                  <span className={styles.dropdown_text}>
                    {item.title}{" "}
                    <img
                      className={styles.chevron}
                      src="/assets/navbar/chevron.svg"
                      alt=""
                    />
                  </span>
                  <div className={styles.dropdown}>
                    {item.links.map((link) => (
                      <Link
                        className={styles.link_message}
                        href={link.link}
                        key={link.message}
                      >
                        {link.message}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className={styles.nav_items_right}>
          <DesktopSearch
            setOverlay={setOverlay}
            availableBreeds={availableBreeds}
            puppies={puppies}
          />
          <a className={styles.phone} href="tel:+16166136801">
            <span className="lg-only">Call Us!</span> (616) 613-6801
          </a>
        </div>
      </nav>
    </>
  );
}
