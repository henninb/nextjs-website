export default function Logout() {

    sessionStorage.removeItem('isAuthenticated');
    console.log('logout');
    return (
      <div>
      </div>
    );
};
