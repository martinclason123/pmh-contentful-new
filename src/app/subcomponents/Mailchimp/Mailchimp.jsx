"use client";
import styles from "./mailchimp.module.css";
import { useState } from "react";
import addSubscriber from "../../../utils/add-subscriber";

export default function Mailchimp({ interests, callback }) {
  const [message, setMessage] = useState("Submit");
  const [disabled, setDisabled] = useState(false);

  let email = "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting");
    setDisabled(true);
    const response = await addSubscriber(email, interests);

    if (response !== "Success!") {
      setMessage(response);

      setTimeout(() => {
        setMessage("Submit");
        setDisabled(false);
      }, 2000);
    } else {
      setMessage(response);
      if (callback) {
        setTimeout(callback, 500);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.email}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          type="email"
          id="email"
          className={styles.email_field}
          required
          placeholder="Email"
          onChange={(e) => {
            email = e.target.value;
          }}
        />
      </div>
      <button className={styles.submit} type="submit" disabled={disabled}>
        <span className={styles.submit_text}>{message}</span>
      </button>
    </form>
  );
}
