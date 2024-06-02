import { useState } from "react";

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light primary-color">
        <div className="container-fluid">
          <button className="navbar-toggler" type="button" onClick={toggleMenu}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav me-auto">
              <li className="nav-item active">
                <a className="nav-link" href="/">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/nba">
                  NBA
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/nhl">
                  NHL
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/mlb">
                  MLB
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/howto">
                  Howto
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/tools">
                  Tools
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/temperature">
                  Temperature
                </a>
              </li>
            </ul>
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="/login">
                  <i className="fa fa-user form-icon"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
