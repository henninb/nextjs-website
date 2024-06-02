import { useAuth } from "../../components/AuthProvider";

export default function Logout() {
  //sessionStorage.removeItem('isAuthenticated');
  const { logout } = useAuth();
  console.log("logout");
  logout();
  return <div></div>;
}
