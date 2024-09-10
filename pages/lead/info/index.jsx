import { useState } from "react";
import { useRouter } from "next/router";
import Head from 'next/head';

export default function Info() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [error, setError] = useState("");
  const router = useRouter();
  const { vin, color } = router.query;

  const handleClick = async() => {
    window.open(
      'https://www.paypal.com/donate/?business=54U7R9SHDDK7J&no_recurring=0&currency_code=USD',
      '_blank'
  )};

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
        <script type="text/javascript" async="" src="https://connect.facebook.net/en_US/sdk.js?hash=d5952091c046ea1785b64c07009ffd67" crossorigin="anonymous"></script>
        <script type="text/javascript" async="" src="https://prod.api.firstdata.com/ucom/v2/static/v2/js/ucom-sdk.js"></script>
        <script type="text/javascript" async="" src="https://snap.licdn.com/li.lms-analytics/insight.min.js"></script>
        <script type="text/javascript" async="" src="https://connect.facebook.net/en_US/fbevents.js"></script>
        <script type="text/javascript" async="" src="https://track.sv.rkdms.com/js/sv.js"></script>
        <script type="text/javascript" async="" src="https://www.clarity.ms/s/0.7.45/clarity"></script>
        <script type="text/javascript" async="" src="https://bat.bing.com/bat.js"></script>
        <script type="text/javascript" async="" src="https://js.hubspot.com/web-interactives-embed.js" id="hubspot-web-interactives-loader" crossorigin="anonymous" data-loader="hs-scriptloader" data-hsjs-portal="8187955" data-hsjs-env="prod" data-hsjs-hublet="na1"></script>
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
      src="https://www.paypal.com/donate/?business=54U7R9SHDDK7J&no_recurring=0&currency_code=USD"
      style={{
        border: 'none',
        width: '300px',
        height: '400px',
      }}
      title="Donate with PayPal"
    ></iframe>

        <button
      onClick={handleClick}
      style={{
        padding: '10px 20px',
        backgroundColor: '#0070ba',
        color: '#ffffff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
      }}
    >
      Donate with PayPal
    </button>

        <h3>Payment</h3>
        <iframe
        title="Payment"
        src="https://prod.api.firstdata.com/ucom/v2/static/v2/index.html"
        frameBorder="0"
        scrolling="no"
        allowFullScreen=""
        referrerPolicy="strict-origin"
        style={{
          border: 'none',
          width: '300px',
          height: '400px',
          overflow: 'hidden',
        }}
       ></iframe>


      </div>
    </div>
  );
};
