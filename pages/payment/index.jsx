import { useState } from 'react';

export default function Payment() {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle payment submission logic here
    console.log('Payment details submitted:', {
      cardName,
      cardNumber,
      expDate,
      cvv,
      billingAddress,
    });
  };

  return (
    <div>
      <h2>Payment Information</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name on Card</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Cardholder Name"
            required
          />
        </div>
        <div>
          <label>Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="XXXX XXXX XXXX XXXX"
            required
            maxLength="16"
          />
        </div>
        <div>
          <label>Expiration Date</label>
          <input
            type="text"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
            placeholder="MM/YY"
            required
            maxLength="5"
          />
        </div>
        <div>
          <label>CVV</label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            placeholder="XXX"
            required
            maxLength="4"
          />
        </div>
        <div>
          <label>Billing Address</label>
          <textarea
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="Street Address, City, State, Zip Code"
            required
          ></textarea>
        </div>
        <button type="submit">Submit Payment</button>
      </form>
    </div>
  );
}
