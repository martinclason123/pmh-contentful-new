"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./mobile-nav.module.css";
import { MobileSearch } from "..";

export default function MobileNav({ menuItems, availableBreeds, puppies }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  return (
    <>
      <div className={`${styles.header} container`}>
        <Link href={"/"}>
          <img
            src="/assets/navbar/logo.svg"
            alt="Paw Prints on My Heart logo"
            width={127}
            height={150}
            className={styles.logo}
          />
        </Link>
        <div className={styles.menu_right}>
          <a className={styles.navbar_phone} href="tel:+16166136801">
            <span class="lg-only">Call Us!</span> (616) 613-6801
          </a>
          <MobileSearch availableBreeds={availableBreeds} puppies={puppies} />
          <img
            src="/assets/navbar/hamburger.svg"
            alt="open menu"
            width={50}
            height={50}
            className={styles.burger}
            onClick={toggleMenu}
          />
        </div>
      </div>

      {menuOpen && <div className={styles.overlay} onClick={toggleMenu}></div>}

      <nav className={`${styles.sidebar} ${menuOpen ? styles.menuOpen : ""}`}>
        <img
          src="/assets/navbar/x.svg"
          alt="close menu"
          className={styles.close}
          onClick={toggleMenu}
        />
        <ul className={styles.menuList}>
          {menuItems.map((item, index) => (
            <li key={item.title}>
              {item.links ? (
                <div
                  className={`${styles.menuItem} ${styles.dropdownTitle}`}
                  onClick={() => toggleDropdown(index)}
                >
                  {item.title}
                  <img
                    src="/assets/navbar/chevron.svg"
                    alt=""
                    className={`${styles.chevron} ${
                      openDropdown === index ? styles.rotate : ""
                    }`}
                  />
                </div>
              ) : (
                <Link
                  href={item.link}
                  className={`${styles.menuItem} ${styles.linkItem}`}
                  onClick={toggleMenu}
                >
                  {item.title}
                </Link>
              )}

              {openDropdown === index && (
                <div className={styles.dropdownContent}>
                  {item.links.map((link) => (
                    <Link
                      onClick={toggleMenu}
                      href={link.link}
                      key={link.message}
                    >
                      {link.message}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
