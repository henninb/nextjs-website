import { useState } from "react";
import { useRouter } from "next/router";

export default function Color() {
  const [color, setColor] = useState("green");
  const router = useRouter();
  const { vin } = router.query;

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/lead/info?vin=${vin}&color=${color}`);
  };

  return (
    <div>
      <h1>Vehicle Color</h1>
      <form onSubmit={handleSubmit}>
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          required
        >
          <option value="">Select Color</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
          <option value="pink">Pink</option>
          <option value="white">White</option>
          <option value="green">Green</option>
          <option value="black">Black</option>
        </select>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
