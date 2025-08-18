"use client";
import styles from "./back.module.css";
import { useRouter } from "next/navigation"; // Use next/navigation instead of next/router

export default function Back() {
  const router = useRouter();

  return (
    <button className={styles.back} onClick={() => router.back()}>
      {"< Back"}
    </button>
  );
}
