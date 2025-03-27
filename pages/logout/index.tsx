import { useEffect } from "react";
import useLogout from "../../hooks/useLogoutProcess";

export default function Logout() {
  const { logout } = useLogout();

  useEffect(() => {
    logout();
  }, [logout]);

  return null;
}