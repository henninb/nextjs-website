import { useEffect } from "react";
import { useRouter } from "next/router";
import cookie from "js-cookie";
import useLogout from "../../hooks/useLogoutProcess";

<<<<<<< HEAD
export default function Logout() {
=======

export default function Logout() {

>>>>>>> refs/remotes/origin/main
  const router = useRouter();
  //const { mutateAsync: u } = useTransferInsert();

  useEffect(() => {
    // Remove the token cookie with the same domain and path as when it was set
    cookie.remove("token", { domain: ".bhenning.com", path: "/" });
    // Redirect to the login page after clearing the token
    router.push("/login");
  }, [router]);

  return null;
<<<<<<< HEAD
};
=======
};
>>>>>>> refs/remotes/origin/main
