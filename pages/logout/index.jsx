import { useAuth } from '../../components/AuthContext';

export default function Logout() {
  //sessionStorage.removeItem('isAuthenticated');
  const { logout } = useAuth();
  console.log("logout");
  logout();
  return <div></div>;
}
