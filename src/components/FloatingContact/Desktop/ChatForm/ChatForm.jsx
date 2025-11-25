"use client";
import { handleDiscordMessage } from "../../pixelEvents";

import styles from "./chatForm.module.scss";
import { useState, useRef } from "react";
import { Check, X } from "lucide-react";
import { sendSMS } from "../../../../utils/sendSMS";

export default function ChatForm({ setChatOpen }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  const formatPhone = (digits) => {
    if (!digits) return "";

    const d = digits.slice(0, 11);
    const hasCountry = d.length === 11 && d.startsWith("1");
    const offset = hasCountry ? 1 : 0;

    let country = hasCountry ? "1 " : "";
    let area = d.slice(offset, offset + 3);
    let prefix = d.slice(offset + 3, offset + 6);
    let line = d.slice(offset + 6, offset + 10);

    if (d.length <= offset + 3) return country + `(${area}`;
    if (d.length <= offset + 6) return country + `(${area}) ${prefix}`;
    return country + `(${area}) ${prefix}-${line}`;
  };

  const normalizePhone = (value) => value.replace(/\D/g, "");

  const isValidPhone = (digits) =>
    digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));

  const phoneRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatus("idle");

    if (!e.target.checkValidity()) {
      // native validation will show messages
      return;
    }

    const digits = normalizePhone(mobile);

    if (!isValidPhone(digits)) {
      phoneRef.current.setCustomValidity(
        "Please enter a valid US phone number"
      );
      phoneRef.current.reportValidity();
      return;
    } else {
      // clear any previous custom error
      phoneRef.current.setCustomValidity("");
    }

    setSubmitting(true);
    const result = await sendSMS(name, digits, message);
    setSubmitting(false);

    if (result.success) {
      setStatus("success");
      // onClick={handleCallClick}
      handleDiscordMessage();
      // optional: clear values
      // setName("");
      // setMobile("");
      // setMessage("");
    } else {
      setStatus("error");
      setErrorMessage(
        result.error ||
          "Something went wrong while sending your message. Please try again."
      );
    }
  };

  const isNameValid = name.trim().length >= 3;
  const digits = normalizePhone(mobile);
  const isMobileValid = isValidPhone(digits);

  return (
    <>
      <div className={styles.chatForm}>
        <h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="18px"
            width="18px"
            viewBox="0 0 17 17"
          >
            <path
              fill="rgba(255,255,255,.4)"
              fillRule="evenodd"
              d="M13.81,6.8a1.06,1.06,0,1,1-1.06-1.06A1.05,1.05,0,0,1,13.81,6.8Zm-4.25,0A1.06,1.06,0,1,1,8.5,5.74,1.05,1.05,0,0,1,9.56,6.8Zm-4.25,0A1.06,1.06,0,1,1,4.25,5.74,1.05,1.05,0,0,1,5.31,6.8ZM1.7,1.7V11.9H5.1v1.7l2.27-1.7H15.3V1.7ZM3.4,17V13.6H1.7A1.7,1.7,0,0,1,0,11.9V1.7A1.7,1.7,0,0,1,1.7,0H15.3A1.7,1.7,0,0,1,17,1.7V11.9a1.7,1.7,0,0,1-1.7,1.7H7.93Z"
            ></path>
          </svg>
          {`Get a quick response via text`}
        </h2>

        <p className={styles.chatBubble}>
          {`Enter your information, and Kara will text you shortly`}
        </p>

        {status === "success" ? (
          <div className={styles.successPane}>
            <p className={styles.successHeading}>Thank you!</p>
            <p className={styles.successBody}>
              Kara has received your message and will text you back at the
              number you provided.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className={styles.formWrapper}>
                <div
                  className={`${styles.inputWrapper} ${
                    isNameValid ? styles.valid : ""
                  } ${name ? styles.hasValue : ""}`}
                >
                  <label className={styles.label} htmlFor="input_name">
                    {`Name`}
                  </label>
                  <input
                    id="input_name"
                    type="text"
                    placeholder=" "
                    autoComplete="name"
                    required={true}
                    minLength={3}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                  />
                  <Check
                    className={styles.checkmark}
                    color="rgb(0, 165, 127)"
                  />
                </div>

                <div
                  className={`${styles.inputWrapper} ${
                    isMobileValid ? styles.valid : ""
                  } ${mobile ? styles.hasValue : ""}`}
                >
                  <label
                    className={styles.label}
                    htmlFor="input_phone"
                  >{`Mobile Phone`}</label>
                  <input
                    id="input_phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder=" "
                    required={true}
                    value={mobile}
                    ref={phoneRef}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = normalizePhone(raw);
                      const formatted = formatPhone(digits);
                      setMobile(formatted);
                    }}
                  />
                  <Check
                    className={styles.checkmark}
                    color="rgb(0, 165, 127)"
                  />
                </div>

                <div
                  className={`${styles.inputWrapper} ${
                    message ? styles.hasValue : ""
                  }`}
                >
                  <label
                    className={styles.label}
                    htmlFor="input_message"
                  >{`Message`}</label>
                  <textarea
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    required={true}
                    minLength={15}
                    placeholder=" "
                    id="input_message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                  ></textarea>
                </div>
              </div>

              <p className={styles.agreement}>
                {`Kara is a real person, not a bot or AI. It may take her a couple minutes to get back to you. You will not be signed up to receive alerts of any kind and your personal information will never be shared.`}
              </p>

              {status === "error" && (
                <p className={styles.errorMessage}>{errorMessage}</p>
              )}

              <button
                disabled={submitting}
                type="submit"
                className={styles.submit}
              >
                {submitting ? "Sending..." : "Submit"}
              </button>
            </form>
          </>
        )}
      </div>

      <button
        onClick={() => {
          setChatOpen(false);
        }}
      >
        <X />
      </button>
    </>
  );
}
