import axios from "axios";
import Head from "next/head";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../components/AuthProvider";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const userLogin = async (payload) => {
    let endpoint = "/api/login";

    const response = await axios.post(endpoint, payload, {
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  };

  const router = useRouter();

  const handleClick = async (event) => {
    event.preventDefault(); // Prevent the form from submitting immediately

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const data = { email, password };

    try {
      let response = await userLogin(data); // Assuming userLogin is your auth function
      if (response.ok) {
        sessionStorage.setItem("token", response.token);
        cookie.set("token", response.token, { expires: 1 }); // Store token in cookie
        login(response.token);
      }
      console.log("response: " + JSON.stringify(response));
      sessionStorage.setItem("isAuthenticated", true);
      router.push("/"); // Redirect to home after login
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const errorMessage = document.querySelector(".error-message");
        errorMessage.innerText = "Failed login. Please check your credentials.";
      }
      console.log(error);
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <Head>
        <title>Login</title>
      </Head>
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-4">
          <div className="card no-border">
            <div className="card-body">
              <form
                name="login-form"
                className="login-form"
                action="/api/login"
                method="POST"
                data-bitwarden-watching="1"
              >
                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <i className="fa fa-user form-icon"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Email"
                    id="email"
                    name="email"
                  />
                </div>
                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <i className="fa fa-lock form-icon"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    id="password"
                    name="password"
                  />
                  <div className="error-message"></div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  onClick={handleClick}
                  style={{ backgroundColor: "#007BFF", width: "100%" }}
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
