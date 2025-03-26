import { useEffect } from "react";
import { useRouter } from "next/router";
import cookie from "js-cookie";


export default function Logout() {

  const router = useRouter();

  useEffect(() => {
    // Remove the token cookie with the same domain and path as when it was set
    cookie.remove("token", { domain: ".bhenning.com", path: "/" });
    // Redirect to the login page after clearing the token
    router.push("/login");
  }, [router]);

  return null;
};