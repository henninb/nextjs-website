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
      const result = await response.json();

      if (response.ok) {
        console.log("Lead generated successfully:" + JSON.stringify(result));
        router.push("/lead/success");  // Redirect to a success page
      } else {
        console.error("Failed to generate lead:" + JSON.stringify(result));
        setError(`Failed to generate lead: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error("Failed to generate lead:" + error);
      setError("An error occurred while generating the lead.");
    }
  };

  return (
    <div>
      <Head>
        <script src="https://connect.facebook.net/en_US/sdk.js?hash=d5952091c046ea1785b64c07009ffd67" async crossorigin="anonymous"></script>
        <script type="text/javascript" async="" src="https://prod.api.firstdata.com/ucom/v2/static/v2/js/ucom-sdk.js"></script>
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
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name"
            required
          />
        </div>
        <br />
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Email"
            required
          />
        </div>

        <button type="submit">Submit</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}


          <div style={{ marginTop: '20px' }}>

        <h3>Donate</h3>
        <iframe
      src="https://www.paypal.com/donate?hosted_button_id=YOUR_BUTTON_ID"
      style={{
        border: 'none',
        width: '300px',
        height: '400px',
      }}
      title="Donate with PayPal"
    ></iframe>

        <iframe
      src="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=YOUR_BUSINESS_NUMBER&currency_code=USD"
      style={{
        border: 'none',
        width: '300px',
        height: '400px',
      }}
      title="Donate with PayPal"
    ></iframe>

        <h3>Payment</h3>
        <iframe id="targetFrame" title="UCOM-SDK" src="https://prod.api.firstdata.com/ucom/v2/static/v2/index.html" frameBorder="0" scrolling="no" allowFullScreen="" referrerPolicy="strict-origin" style={{ width: '100%', overflow: 'hidden', height: '459px' }}></iframe>

        <h3>Additional Information</h3>

        <iframe
          src="https://example.com"
          width="100%"
          height="300px"
          style={{ border: '1px solid #ccc' }}
          title="Additional Information"
        ></iframe>
      </div>
    </div>
  );
};
