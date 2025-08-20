"use client";
import styles from "./form.module.css";

import { useState } from "react";
import ReactDOM from "react-dom";
import { useFormspark } from "@formspark/use-formspark";

export default function Form({ subject = "General inquiry" }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [messageText, setMessageText] = useState("");

  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Submit");

  const FORMSPARK_FORM_ID = "ZWTY6ti0";

  const [submit, submitting] = useFormspark({
    formId: FORMSPARK_FORM_ID,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      subject,
      first,
      last,
      phone,
      email,
      message: messageText,
    };
    setMessage("Submitting");
    try {
      await submit(formData);
      setSuccess(true);
      setMessage("Success!");
    } catch (error) {
      console.log(error);
      setMessage("Error!");
      setTimeout(() => {
        setMessage("Submit");
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.half}>
        <field>
          <label className={styles.label} htmlFor="first">
            First Name*
          </label>
          <input
            type="text"
            required
            id="first"
            onChange={(e) => {
              setFirst(e.target.value);
            }}
          />
        </field>
        <field>
          <label className={styles.label} htmlFor="last">
            Last Name*
          </label>
          <input
            type="text"
            required
            id="last"
            onChange={(e) => {
              setLast(e.target.value);
            }}
          />
        </field>
      </div>

      <div className={styles.half}>
        <field>
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            onChange={(e) => {
              setPhone(e.target.value);
            }}
          />
        </field>
        <field>
          <label htmlFor="email">Email Address*</label>
          <input
            type="email"
            id="email"
            required
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </field>
      </div>
      <field>
        <label htmlFor="message">Message*</label>
        <textarea
          type="textarea"
          id="message"
          required
          onChange={(e) => {
            setMessageText(e.target.value);
          }}
        />
      </field>

      <button disabled={submitting} type="submit">
        {message}
      </button>
    </form>
  );
}
