import { useState, ReactNode } from "react";
import { useRouter } from "next/router";
import SelectNavigateAccounts from "./SelectNavigateAccounts";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const { pathname } = router;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isFinancePage: boolean = pathname.startsWith("/finance");
  const navbarClass = isFinancePage ? "navbar navbar-expand-lg navbar-dark bg-dark" : "navbar navbar-expand-lg navbar-light bg-light";

  return (
    <div>
      <nav className={navbarClass}>
        <div className="container-fluid flex-column">
          <div className="d-flex justify-content-center w-100 mb-2">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="/login">
                  <i className="fa fa-user form-icon"></i>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/logout">
                  <i className="fa fa-sign-out-alt form-icon"></i>
                </a>
              </li>
            </ul>
          </div>
          <button
            className="navbar-toggler align-self-center"
            type="button"
            onClick={toggleMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav mx-auto">
              {isFinancePage ? (
                <>
                  <li className="nav-item active"><a className="nav-link" href="/finance/">Home</a></li>
                  <li className="nav-item"><a className="nav-link" href="/finance/transfers">Transfer</a></li>
                  <li className="nav-item"><a className="nav-link" href="/finance/payments">Payments</a></li>
                  <li className="nav-item"><a className="nav-link" href="/finance/paymentrequired">PaymentsRequired</a></li>
                  <li className="nav-item"><a className="nav-link" href="/finance/categories">Categories</a></li>
                  <li className="nav-item"><a className="nav-link" href="/finance/descriptions">Descriptions</a></li>
                  <li className="nav-item"><a className="nav-link" href="/finance/configuration">Configuration</a></li>
                  <li className="nav-item"><SelectNavigateAccounts /></li>
                </>
              ) : (
                <>
                  <li className="nav-item active"><a className="nav-link" href="/">Home</a></li>
                  <li className="nav-item"><a className="nav-link" href="/nba">NBA</a></li>
                  <li className="nav-item"><a className="nav-link" href="/nhl">NHL</a></li>
                  <li className="nav-item"><a className="nav-link" href="/mlb">MLB</a></li>
                  <li className="nav-item"><a className="nav-link" href="/howto">Howto</a></li>
                  <li className="nav-item"><a className="nav-link" href="/tools">Tools</a></li>
                  <li className="nav-item"><a className="nav-link" href="/temperature">Temperature</a></li>
                  <li className="nav-item"><a className="nav-link" href="/lead">Lead</a></li>
                  <li className="nav-item"><a className="nav-link" href="/payment">Payment</a></li>
                  <li className="nav-item"><a className="nav-link" href="/spotifyauth">SpotifyAuth</a></li>
                  <li className="nav-item"><a className="nav-link" href="/finance">Finance</a></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}