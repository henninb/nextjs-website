import { useState } from "react";
import { useRouter } from "next/router";

function Modal({ message, onClose }) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
};

export default function Info() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [responseMessage, setResponseMessage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const { vin, color } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalVisible(true);
    setResponseMessage("Submitting...");

    const data = {
      vin,
      color,
      name,
      email,
    };
    console.log("Claim submitted:", data);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "x-bh-test": "3",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Lead generated successfully:" + JSON.stringify(result));
        setResponseMessage(
          "Lead generated successfully:" + JSON.stringify(result),
        );
      } else {
        console.error("Failed to generate lead:" + JSON.stringify(result));
        setResponseMessage("Failed to generate lead:" + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("An error occurred while generating the lead.");
    }
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    setIsModalVisible(true);
    setResponseMessage("Submitting...");

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
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Lead generated successfully:" + JSON.stringify(result));
        setResponseMessage(
          "Lead generated successfully: " + JSON.stringify(result),
        );
      } else {
        console.error("Failed to generate lead:" + JSON.stringify(result));
        setResponseMessage(
          "Failed to generate lead: " + JSON.stringify(result),
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("An error occurred while generating the lead.");
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setResponseMessage("");
  };

  return (
    <div>
      <h3>Wrapped - Enter Your Information</h3>
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
      <br />
      <h3>Not-Wrapped API - Enter Your Information</h3>
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
      {isModalVisible && (
        <Modal message={responseMessage} onClose={handleCloseModal} />
      )}
    </div>
  );
}
