import { useState } from "react";
import { useRouter } from "next/router";
import Head from 'next/head';

export default function Info() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [error, setError] = useState("");
  const router = useRouter();
  const { vin, color } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const data = {
      vin,
      color,
      name,
      email,
    };

    try {
      const response = await fetch("https://g9dugr14pk.execute-api.us-east-1.amazonaws.com/prod/api-lead", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("Lead generated successfully:" + JSON.stringify(result));
        router.push("/lead/success");  // Redirect to a success page
      } else {
        const result = await response.json();
        console.error("Failed to generate lead:" + JSON.stringify(result));
        setError(`Failed to generate lead: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error("Failed to generate lead:" + error);
      console.error("Failed to generate lead:" + JSON.stringify(error));
      setError("An error occurred while generating the lead.");
    }
  };

  return (
    <div>
      <Head>
        <script
          type="text/javascript"
          integrity="sha384-MBHPie4YFudCVszzJY9HtVPk9Gw6aDksZxfvfxib8foDhGnE9A0OriRHh3kbhG3q"
          crossOrigin="anonymous"
          async
          src="https://cdn.amplitude.com/libs/amplitude-8.16.1-min.gz.js"
        ></script>
      </Head>
      <h3>Enter Your Information</h3>
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
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};
