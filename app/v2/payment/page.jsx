"use client";

import React, { useState, useEffect } from "react";

export default function Payment() {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});

  // 👇 Added effect to set and unset hs_pagetype
  useEffect(() => {
    // Set hs_pagetype when this page/component mounts
    window["hs_pagetype"] = "checkout"; // ← Comment: setting on page visit

    return () => {
      // Unset hs_pagetype when this page/component unmounts
      delete window["hs_pagetype"]; // ← Comment: cleaning up on page leave
    };
  }, []);

  const handleClick = async () => {
    window.open(
      "https://www.paypal.com/donate/?business=54U7R9SHDDK7J&no_recurring=0&currency_code=USD",
      "_blank",
    );
  };

  const validateInput = () => {
    const errors = {};
    const cardNumberRegex = /^\d{16}$/;
    const expDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3,4}$/;

    if (!cardName.trim()) {
      errors.cardName = "Cardholder name is required";
    }

    if (!cardNumberRegex.test(cardNumber)) {
      errors.cardNumber = "Card number must be 16 digits";
    }

    if (!expDateRegex.test(expDate)) {
      errors.expDate = "Expiration date must be in MM/YY format";
    }

    if (!cvvRegex.test(cvv)) {
      errors.cvv = "CVV must be 3 or 4 digits";
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateInput();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
      // Handle successful payment logic here
      console.log("Payment details submitted:", {
        cardName,
        cardNumber,
        expDate,
        cvv,
      });
    }
  };

  return (
    <div>
      
      <h2>Payment Information</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name on Card: </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Cardholder Name"
            required
          />
          {errors.cardName && <p style={{ color: "red" }}>{errors.cardName}</p>}
        </div>
        <div>
          <label>Card Number: </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="XXXX XXXX XXXX XXXX"
            required
            maxLength="16"
          />
          {errors.cardNumber && (
            <p style={{ color: "red" }}>{errors.cardNumber}</p>
          )}
        </div>
        <div>
          <label>Expiration Date: </label>
          <input
            type="text"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
            placeholder="MM/YY"
            required
            maxLength="5"
          />
          {errors.expDate && <p style={{ color: "red" }}>{errors.expDate}</p>}
        </div>
        <div>
          <label>CVV: </label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            placeholder="XXX"
            required
            maxLength="4"
          />
          {errors.cvv && <p style={{ color: "red" }}>{errors.cvv}</p>}
        </div>
        <button type="submit">Submit Payment</button>
      </form>

      <button
        onClick={handleClick}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0070ba",
          color: "#ffffff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Donate with PayPal
      </button>
    </div>
  );
}
