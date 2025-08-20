import React from "react";
import { useState, useEffect, FormEvent } from "react";

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

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const initialValues: FormData = {
    firstName: "",
    middleInitial: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    securityQuestion: "",
    securityAnswer: "",
    phoneNumber: "",
    zipCode: "",
    citizenship: "",
  };

  const [values, setValues] = useState<FormData>(initialValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const descriptors: {
    label: string;
    name: keyof FormData;
    required?: boolean;
    type?: string;
    pattern?: RegExp;
    placeholder?: string;
  }[] = [
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
  ];

  const validate = (): boolean => {
    const errs: FormErrors = {};
    for (const d of descriptors) {
      const v = (values[d.name] as unknown as string) || "";
      if (d.required && !v.trim()) {
        errs[d.name] = `${d.label} is required`;
        continue;
      }
      if (d.pattern && v && !d.pattern.test(v)) {
        errs[d.name] = `Invalid ${d.label.toLowerCase()}`;
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setFormData(values);
    setSubmitted(true);
  };

  const handleModalClose = () => {
    setSubmitted(false);
    setValues(initialValues);
    setFormErrors({});
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

        <form onSubmit={onSubmit} className="space-y-4">
          {descriptors.map(
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
                  id={name}
                  name={name}
                  type={type}
                  placeholder={placeholder}
                  className="form-input"
                  value={(values[name] as unknown as string) ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [name]: e.target.value,
                    }))
                  }
                  aria-invalid={!!formErrors[name]}
                />
                {formErrors[name] && (
                  <p className="form-error">{formErrors[name]}</p>
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
