"use client";
import styles from "./agreement.module.css";
import { useState } from "react";

export default function Agreement({ deposit, puppy }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [foundUs, setFoundUs] = useState("");
  const [other, setOther] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false); // Control for showing "Other" input
  const [message, setMessage] = useState("Continue");

  let href = "/api/deposit";
  if (!deposit) {
    href = "/api/balance";
  }

  const stripeCheckout = async (userData, puppy) => {
    try {
      const response = await fetch(href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ puppyData: puppy, userData }),
      });

      const session = await response.json();

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Unable to create checkout session");
      }
    } catch (error) {
      setMessage("Error. Try again.");
      setTimeout(() => setMessage("Continue"), 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If the buyer already exists, we do not need to gather form data
    const userData = puppy.buyer
      ? {
          email: puppy.buyerEmail,
          first: puppy.buyerName.split(" ")[0], // First name
          last: puppy.buyerName.split(" ")[1], // Last name
          phone: puppy.buyerPhone,
        }
      : {
          first,
          last,
          phone,
          email,
          street,
          city,
          state,
          zip,
          foundUs: showOtherInput ? other : foundUs, // Use "Other" value if it's selected
        };

    setMessage("Processing...");

    stripeCheckout(userData, puppy);
  };

  const handleRadioChange = (e) => {
    setFoundUs(e.target.value);
    setShowOtherInput(false); // Hide the other input if another radio button is selected
    setOther(""); // Clear "Other" field if another option is selected
  };

  const handleOtherRadioChange = () => {
    setFoundUs("Other");
    setShowOtherInput(true); // Show the "Other" input field
  };

  const handleOtherChange = (e) => {
    setOther(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.agreement}>
      {/* Check if puppy already has a buyer */}
      {puppy.buyer ? null : (
        <>
          {/* Show form fields if puppy doesn't have a buyer */}
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

          <div>
            <field>
              <label htmlFor="phone">Phone*</label>
              <input
                type="tel"
                required
                id="phone"
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
              />
            </field>
          </div>

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

          {/* Address Fields */}
          <field>
            <label htmlFor="street">Street*</label>
            <input
              type="text"
              id="street"
              required
              onChange={(e) => {
                setStreet(e.target.value);
              }}
            />
          </field>

          <div className={styles.half}>
            <field>
              <label htmlFor="city">City*</label>
              <input
                type="text"
                id="city"
                required
                onChange={(e) => {
                  setCity(e.target.value);
                }}
              />
            </field>

            <field>
              <label htmlFor="state">State*</label>
              <input
                type="text"
                id="state"
                required
                onChange={(e) => {
                  setState(e.target.value);
                }}
              />
            </field>
          </div>

          <field>
            <label htmlFor="zip">Zip Code*</label>
            <input
              type="text"
              id="zip"
              required
              onChange={(e) => {
                setZip(e.target.value);
              }}
            />
          </field>

          {/* "How did you find us?" Section */}
          <div>
            <label className={`${styles.label} ${styles.radioLabel}`}>
              How did you find us?*
            </label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  name="foundUs"
                  value="Google search"
                  checked={foundUs === "Google search"}
                  onChange={handleRadioChange}
                />
                Google search
              </label>

              <label>
                <input
                  type="radio"
                  name="foundUs"
                  value="Facebook"
                  checked={foundUs === "Facebook"}
                  onChange={handleRadioChange}
                />
                Facebook
              </label>

              <label>
                <input
                  type="radio"
                  name="foundUs"
                  value="Personal reference"
                  checked={foundUs === "Personal reference"}
                  onChange={handleRadioChange}
                />
                Personal reference
              </label>

              <label>
                <input
                  type="radio"
                  name="foundUs"
                  value="Can't remember"
                  checked={foundUs === "Can't remember"}
                  onChange={handleRadioChange}
                />
                {`Can't remember`}
              </label>

              <label>
                <input
                  type="radio"
                  name="foundUs"
                  value="Other"
                  checked={foundUs === "Other"}
                  onChange={handleOtherRadioChange}
                />
                Other
              </label>

              {/* Display the "Other" input field only if "Other" is selected */}
              {showOtherInput && (
                <div>
                  <field>
                    <label htmlFor="otherInput">Please specify*</label>
                    <input
                      id="otherInput"
                      type="text"
                      name="other"
                      value={other}
                      required={showOtherInput} // Make it required if shown
                      className={styles.fullWidthInput}
                      onChange={handleOtherChange}
                    />
                  </field>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <button type="submit">{message}</button>
    </form>
  );
}
