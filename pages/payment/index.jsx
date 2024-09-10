import { useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Payment() {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState({});

  const validateInput = () => {
    const errors = {};
    const cardNumberRegex = /^\d{16}$/;
    const expDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3,4}$/;

    if (!cardName.trim()) {
      errors.cardName = 'Cardholder name is required';
    }

    if (!cardNumberRegex.test(cardNumber)) {
      errors.cardNumber = 'Card number must be 16 digits';
    }

    if (!expDateRegex.test(expDate)) {
      errors.expDate = 'Expiration date must be in MM/YY format';
    }

    if (!cvvRegex.test(cvv)) {
      errors.cvv = 'CVV must be 3 or 4 digits';
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
      console.log('Payment details submitted:', {
        cardName,
        cardNumber,
        expDate,
        cvv,
      });
    }
  };

  return (
    <div>
    <Head>
        <Script type="text/javascript" async="" src="https://cdn.userway.org/remediation/2024-09-09-09-41-58/paid/remediation-tool.js"></Script>
        <Script type="text/javascript" async="" src="https://cdn.rlets.com/capture_configs/d68/2d8/ef1/311474ea88290056581be3c.js"></Script>
        <Script type="text/javascript" async="" src="https://connect.facebook.net/en_US/sdk.js" crossorigin="anonymous"></Script>
        <Script type="text/javascript" async="" src="https://prod.api.firstdata.com/ucom/v2/static/v2/js/ucom-sdk.js"></Script>
        <Script type="text/javascript" async="" src="https://snap.licdn.com/li.lms-analytics/insight.min.js"></Script>
        <Script type="text/javascript" async="" src="https://track.sv.rkdms.com/js/sv.js"></Script>
        <Script type="text/javascript" async="" src="https://www.clarity.ms/s/0.7.45/clarity.js"></Script>
        <Script type="text/javascript" async="" src="https://bat.bing.com/bat.js"></Script>
        <Script type="text/javascript" async="" src="https://js.hubspot.com/web-interactives-embed.js" id="hubspot-web-interactives-loader" crossorigin="anonymous" data-loader="hs-scriptloader" data-hsjs-portal="8187955" data-hsjs-env="prod" data-hsjs-hublet="na1"></Script>
        <Script
          type="text/javascript"
          integrity="sha384-MBHPie4YFudCVszzJY9HtVPk9Gw6aDksZxfvfxib8foDhGnE9A0OriRHh3kbhG3q"
          crossOrigin="anonymous"
          async
          src="https://cdn.amplitude.com/libs/amplitude-8.16.1-min.gz.js"
        ></Script>
      </Head>
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
          {errors.cardName && <p style={{ color: 'red' }}>{errors.cardName}</p>}
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
          {errors.cardNumber && <p style={{ color: 'red' }}>{errors.cardNumber}</p>}
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
          {errors.expDate && <p style={{ color: 'red' }}>{errors.expDate}</p>}
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
          {errors.cvv && <p style={{ color: 'red' }}>{errors.cvv}</p>}
        </div>
        <button type="submit">Submit Payment</button>
      </form>


        <div className="payment-form">
        <h2>Enter Your Payment Details</h2>
        <div className="iframe-container">
            <iframe src="https://example.com/credit-card-form"></iframe>
        </div>
    </div>
    </div>
  );
}
