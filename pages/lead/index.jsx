import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [vin, setVin] = useState("12345678901234567");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/lead/color?vin=${vin}`);
  };

  return (
    <div>
      <h1>Vehicle VIN</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          placeholder="Enter VIN"
          required
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}