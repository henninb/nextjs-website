import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Info() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { vin, color } = router.query;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle final submission here
    const data = {
      vin,
      color,
      name,
      email,
    };
    console.log('Claim submitted:', data);
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
