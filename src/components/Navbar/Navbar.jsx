// "use client";
// import { useState } from "react";
import Link from "next/link";
import styles from "./navbar.module.css";
import { MobileNav, DesktopNav } from "../../app/subcomponents";

import {
  getPuppies,
  getLitters,
  getAvailableBreeds,
  getAvailableLitters,
} from "../../utils";

const Navbar = async () => {
  let puppies = await getPuppies();
  let litters = await getLitters();
  const availableBreeds = getAvailableBreeds(puppies);
  const availableLitters = getAvailableLitters(litters);

  const menuItems = [
    {
      title: "Litters",
      links: [
        ...availableLitters,
        { message: "View All Litters", link: "/litters" },
      ],
    },
    {
      title: "Available Puppies",
      links: [
        ...availableBreeds,
        { message: "View All Puppies", link: "./puppies" },
      ],
    },
    { title: "Location/Contact", link: "/#location" },
    { title: "About", link: "/about" },
  ];

  return (
    <>
      <DesktopNav
        menuItems={menuItems}
        availableBreeds={availableBreeds}
        puppies={puppies}
      />
      <MobileNav
        menuItems={menuItems}
        availableBreeds={availableBreeds}
        puppies={puppies}
      />
    </>
  );
};

export default Navbar;
