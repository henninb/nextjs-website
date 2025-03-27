import { useState } from "react";
import { useRouter } from "next/router";
//import { useAuth } from "../components/AuthProvider";

export default function useLogout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const logoutNow = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('trying')
      const response = await fetch("https://finance.bhenning.com/api/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are sent with the request
      });
      console.log('trying now')
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { logoutNow, loading, error };
}
