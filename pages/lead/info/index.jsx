import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Info() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [responseMessage, setResponseMessage] = useState("");
  const router = useRouter();
  const { vin, color } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      vin,
      color,
      name,
      email,
    };
    console.log("Claim submitted:", data);
    try {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      const response = await fetch("/api/lead",
        {
          method: "POST",
          headers: {
            "x-bh-test": "3",
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Lead generated successfully:", result);
        setResponseMessage("Lead generated successfully!");
      } else {
        console.error("Failed to generate lead:", result);
        setResponseMessage("Failed to generate lead.");
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("An error occurred while generating the lead.");
    }
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    const data = {
      vin,
      color,
      name,
      email,
    };
    console.log("Claim submitted:", data);
    try {
      const response = await fetch(
        "https://f5x3msep1f.execute-api.us-east-1.amazonaws.com/prod/api-lead",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Lead generated successfully:", result);
        setResponseMessage("Lead generated successfully!");
      } else {
        console.error("Failed to generate lead:", result);
        setResponseMessage("Failed to generate lead.");
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("An error occurred while generating the lead.");
    }
  };

  return (
    <div>
      <h1>Enter Your Information</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Email"
          required
        />
        <button type="submit">Submit</button>
      </form>
    <div>
      <form onSubmit={handleSubmitNew}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Email"
          required
        />
        <button type="submit">Submit</button>
      </form>
    </div>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
}
