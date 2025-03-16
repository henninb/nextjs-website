import { useEffect } from "react";
import { useRouter } from "next/router";
import cookie from "js-cookie";

const Logout = () => {
  const router = useRouter();

  useEffect(() => {
    // Remove the token cookie
    cookie.remove("token");
    // Redirect to the home page after clearing the token
    router.push("/login");
  }, [router]);

  return null;
};

export default Logout;
