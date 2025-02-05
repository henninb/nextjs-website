import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
//import "../styles/form.css"

interface FormData {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  phoneNumber: string;
  zipCode: string;
  citizenship: string;
}

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const onSubmit = (data: FormData) => {
    setFormData(data);
    setSubmitted(true);
  };

  const handleModalClose = () => {
    setSubmitted(false);
    reset();
  };

  useEffect(() => {
    // Function to insert a script tag at the very top of <head>
    const insertScript = (src) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.defer = false; // Execute immediately
        document.head.prepend(script); // Insert at the top of <head>
      }
    };

    insertScript("https://code.jquery.com/jquery-3.7.1.min.js");
  }, []);

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Contact Information</h2>
        <p className="form-description">
          Please fill in your details as they appear on official documents.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { label: "First Name", name: "firstName", required: true },
            { label: "Middle Initial (optional)", name: "middleInitial" },
            { label: "Last Name", name: "lastName", required: true },
            {
              label: "Email Address",
              name: "email",
              required: true,
              pattern: /.+@.+\..+/,
            },
            { label: "Create Username", name: "username", required: true },
            {
              label: "Create Password",
              name: "password",
              required: true,
              type: "password",
            },
            {
              label: "Security Question",
              name: "securityQuestion",
              required: true,
            },
            { label: "Answer", name: "securityAnswer", required: true },
            {
              label: "Phone Number",
              name: "phoneNumber",
              required: true,
              placeholder: "(XXX) XXX-XXXX",
            },
            { label: "Zip/Postal Code", name: "zipCode", required: true },
            {
              label: "Citizenship",
              name: "citizenship",
              required: true,
              placeholder: "Search Citizenship...",
            },
          ].map(
            ({
              label,
              name,
              required,
              type = "text",
              pattern,
              placeholder,
            }) => (
              <div key={name} className="form-group">
                <label htmlFor={name} className="form-label">
                  {label}
                </label>
                <input
                  {...register(
                    name as keyof FormData,
                    required
                      ? { required: `${label} is required`, pattern }
                      : {},
                  )}
                  type={type}
                  placeholder={placeholder}
                  id={name}
                  className="form-input"
                />
                {errors[name as keyof FormData] && (
                  <p className="form-error">
                    {errors[name as keyof FormData]?.message}
                  </p>
                )}
              </div>
            ),
          )}

          <div className="mt-6">
            <button type="submit" className="form-button">
              Submit
            </button>
          </div>
        </form>

        {/* Modal for displaying summary */}
        {submitted && formData && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Form Submission Summary</h3>
              <div className="modal-summary">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="py-1">
                    <strong className="modal-summary">
                      {key.replace(/([A-Z])/g, " $1")}:
                    </strong>
                    {value}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button onClick={handleModalClose} className="modal-button">
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
