import { useAuth } from "../../components/AuthProvider";

export default function Logout() {
  const { logout } = useAuth();
  console.log("logout");
  logout();
  return <div></div>;
}
