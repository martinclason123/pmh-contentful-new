"use client";
import { handleDiscordMessage } from "../../pixelEvents";

import styles from "./waitlistForm.module.scss";
import { useState, useRef, useMemo } from "react";
import { Check } from "lucide-react";
import Image from "next/image";

export default function ChatForm({ waitlistData }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [breed, setBreed] = useState(""); // waitlistId
  const [message, setMessage] = useState(""); // optional
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  // Build radio options from Contentful data
  const BREED_OPTIONS = useMemo(() => {
    if (!waitlistData) return [];
    return Object.entries(waitlistData).map(([waitlistId, data]) => {
      const memberCount = Array.isArray(data?.members)
        ? data.members.length
        : 0;
      const baseLabel = data?.breed || "Unknown";
      return {
        id: waitlistId,
        label:
          memberCount > 0 ? `${baseLabel} - ${memberCount} members` : baseLabel,
      };
    });
  }, [waitlistData]);

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

  const normalizeEmail = (value) => value.trim().toLowerCase();
  const isValidEmail = (value) => {
    const v = normalizeEmail(value);
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  };

  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const breedFirstRadioRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatus("idle");

    phoneRef.current?.setCustomValidity("");
    emailRef.current?.setCustomValidity("");
    breedFirstRadioRef.current?.setCustomValidity("");

    if (!e.target.checkValidity()) {
      e.target.reportValidity();
      return;
    }

    const digits = normalizePhone(mobile);
    if (!isValidPhone(digits)) {
      phoneRef.current?.setCustomValidity(
        "Please enter a valid US phone number"
      );
      phoneRef.current?.reportValidity();
      return;
    }

    const cleanedEmail = normalizeEmail(email);
    if (!isValidEmail(cleanedEmail)) {
      emailRef.current?.setCustomValidity("Please enter a valid email address");
      emailRef.current?.reportValidity();
      return;
    }

    if (!breed) {
      breedFirstRadioRef.current?.setCustomValidity(
        "Please select a breed waitlist"
      );
      breedFirstRadioRef.current?.reportValidity();
      return;
    }

    setSubmitting(true);

    try {
      const breedName = waitlistData?.[breed]?.breed || "";
      const payload = {
        transactionType: "waitlist",
        // requestId + code will be added in the NEXT milestone when endpoint is updated
        waitlistId: breed,
        breedName,
        name: name.trim(),
        phone: digits,
        email: cleanedEmail,
        message: message?.trim() ? message.trim() : "",
      };

      const res = await fetch("/api/waitlist/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || "Unable to start checkout. Please try again."
        );
      }

      // Placeholder endpoint does not return a Stripe URL yet.
      // In the NEXT milestone, you'll redirect:
      // if (data?.url) window.location.href = data.url;
      if (data?.url) {
        setStatus("success");

        window.location.href = data.url;
      }

      handleDiscordMessage();
    } catch (err) {
      console.error("[waitlist checkout] error:", err);
      setStatus("error");
      setErrorMessage(
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isNameValid = name.trim().length >= 3;
  const digits = normalizePhone(mobile);
  const isMobileValid = isValidPhone(digits);
  const isEmailValid = isValidEmail(email);
  const isBreedValid = !!breed;

  return (
    <>
      <div className={styles.chatForm}>
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
            <Image
              alt="dog waiting by the door"
              src="/assets/waitlist/waiting-d.jpg"
              height={1920}
              width={1200}
              class="sm-only"
            />
            <Image
              alt="dog waiting by the door"
              src="/assets/waitlist/waiting-d-b.jpg"
              height={600}
              width={1920}
              class="lg-only"
            />

            <header>
              <h1>Priority Waitlist</h1>
              <p>
                Join our priority waitlist and get early access to upcoming
                litters.
              </p>
              <p>
                A $300 priority waitlist fee gives you first access to matching
                litters and is applied toward the total adoption fee.
              </p>
              <p>
                No obligation until you reserve a puppy. Fully refundable until
                used.
              </p>
            </header>

            <form onSubmit={handleSubmit}>
              <div className={styles.formWrapper}>
                <div
                  className={`${styles.inputWrapper} ${
                    isNameValid ? styles.valid : ""
                  } ${name ? styles.hasValue : ""}`}
                >
                  <label
                    className={styles.label}
                    htmlFor="input_name"
                  >{`Name*`}</label>
                  <input
                    id="input_name"
                    type="text"
                    placeholder=" "
                    autoComplete="name"
                    required={true}
                    minLength={3}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  >{`Phone*`}</label>
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
                      const d = normalizePhone(raw);
                      setMobile(formatPhone(d));
                      phoneRef.current?.setCustomValidity("");
                    }}
                  />
                  <Check
                    className={styles.checkmark}
                    color="rgb(0, 165, 127)"
                  />
                </div>

                <div
                  className={`${styles.inputWrapper} ${
                    isEmailValid ? styles.valid : ""
                  } ${email ? styles.hasValue : ""}`}
                >
                  <label
                    className={styles.label}
                    htmlFor="input_email"
                  >{`Email*`}</label>
                  <input
                    id="input_email"
                    type="email"
                    autoComplete="email"
                    placeholder=" "
                    required={true}
                    value={email}
                    ref={emailRef}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      emailRef.current?.setCustomValidity("");
                    }}
                  />
                  <Check
                    className={styles.checkmark}
                    color="rgb(0, 165, 127)"
                  />
                </div>

                {/* Breed options from Contentful */}
                <fieldset
                  className={`${styles.radioGroup} ${
                    isBreedValid ? styles.valid : ""
                  }`}
                >
                  <legend
                    className={styles.radioLegend}
                  >{`Select breed waitlist*`}</legend>

                  <div className={styles.radioList}>
                    {BREED_OPTIONS.map((opt, idx) => (
                      <label key={opt.id} className={styles.radioOption}>
                        <input
                          ref={idx === 0 ? breedFirstRadioRef : null}
                          type="radio"
                          name="breed_waitlist"
                          value={opt.id}
                          required={true}
                          checked={breed === opt.id}
                          onChange={(e) => {
                            setBreed(e.target.value);
                            breedFirstRadioRef.current?.setCustomValidity("");
                          }}
                        />
                        <span className={styles.radioLabelText}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div
                  className={`${styles.inputWrapper} ${
                    message ? styles.hasValue : ""
                  }`}
                >
                  <label
                    className={styles.label}
                    htmlFor="input_message"
                  >{`Message (optional)`}</label>
                  <textarea
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    placeholder=" "
                    id="input_message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {status === "error" && (
                <p className={styles.errorMessage}>{errorMessage}</p>
              )}

              <div className={styles.ctaBlock}>
                <button
                  disabled={submitting}
                  type="submit"
                  className={styles.submit}
                >
                  <span>
                    {submitting ? "Sending..." : "Continue to secure waitlist"}
                  </span>
                </button>

                <p className={styles.nextStep}>
                  You’ll be redirected to our secure Stripe checkout to pay the
                  $300 waitlist fee.
                </p>

                <p className={styles.termsNote}>
                  By clicking “Continue to secure waitlist”, you agree to the
                  waitlist terms described in the FAQ below.
                </p>
              </div>

              <div className={styles.sectionDivider} aria-hidden="true" />
            </form>
          </>
        )}
      </div>
    </>
  );
}
