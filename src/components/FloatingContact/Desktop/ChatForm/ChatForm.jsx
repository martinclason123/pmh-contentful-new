"use client";
import { useState } from "react";
export default function ChatForm({ setChatOpen }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");

  const formatPhone = (digits) => {
    if (!digits) return "";

    // Limit digits to 11 (optional +1)
    const d = digits.slice(0, 11);

    // If starts with 1, treat as country code
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

  const normalizePhone = (value) => {
    return value.replace(/\D/g, "");
  };

  const isValidPhone = (digits) => {
    return (
      digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))
    );
  };

  const handleSubmit = (e) => {
    if (!e.target.checkValidity()) {
      // Browser will show native tooltips automatically
      return;
    }
    const digits = normalizePhone(mobile);

    if (!isValidPhone(digits)) {
      alert("Please enter valid US mobile phone number");
    }
    e.preventDefault();
    console.log("Submitting:", { name, mobile: digits, message });
  };

  return (
    <>
      <div>
        <h2>{`Get a quick response vias text`}</h2>
        <p>{`Enter your information, and Kara will text you shortly`}</p>
        <form
          onSubmit={(e) => {
            handleSubmit(e);
          }}
        >
          <label className="visually-hidden" htmlFor="input_name">
            {`Name`}
          </label>
          <input
            id="input_name"
            type="text"
            placeholder="Name"
            autoComplete="name"
            required={true}
            minLength={3}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
          <label
            className="visually-hidden"
            htmlFor="input_phone"
          >{`Mobile Phone`}</label>
          <input
            id="input_phone"
            type="tel"
            autoComplete="tel"
            placeholder="Mobile Phone"
            required={true}
            value={mobile}
            onChange={(e) => {
              const raw = e.target.value;
              const digits = normalizePhone(raw);
              const formatted = formatPhone(digits);
              setMobile(formatted);
            }}
          />
          <label
            className="visually-hidden"
            htmlFor="input_message"
          >{`Message`}</label>
          <textarea
            required={true}
            minLength={15}
            placeholder="Message"
            id="input_message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          ></textarea>

          <button type="submit">Submit</button>
        </form>
      </div>
      <button
        onClick={() => {
          setChatOpen(false);
        }}
      >
        <span>x</span>
      </button>
    </>
  );
}
