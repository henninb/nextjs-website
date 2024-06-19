import { useState } from "react";
import { useRouter } from "next/router";

export default function Info() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { vin, color } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle final submission here
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
        },
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Lead generated successfully:", result);
        // Optionally, you can redirect the user to a success page or show a success message
        alert("Lead generated successfully!");
        // router.push('/success'); // Uncomment to redirect to a success page
      } else {
        console.error("Failed to generate lead:", result);
        alert("Failed to generate lead");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while generating the lead");
    }
    // You can send the data to your server here
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
    </div>
  );
}
