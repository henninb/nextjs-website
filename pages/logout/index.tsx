import { useEffect } from "react";
import { useRouter } from "next/router";
import cookie from "js-cookie";
import useLogout from "../../hooks/useLogoutProcess";

export default function Logout() {
  const router = useRouter();
  //const { mutateAsync: u } = useTransferInsert();

  useEffect(() => {
    // Remove the token cookie
    cookie.remove("token");
    // Redirect to the home page after clearing the token
    router.push("/login");
  }, [router]);

  return null;
};
