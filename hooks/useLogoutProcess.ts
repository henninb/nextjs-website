import { useState } from "react";
import { useRouter } from "next/router";
//import { useAuth } from "../components/AuthProvider";

export default function useLogout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://finance.bhenning.com/api/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are sent with the request
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      //logout();
      // After successful logout, redirect to the login page
      //router.push("/login");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error };
}
