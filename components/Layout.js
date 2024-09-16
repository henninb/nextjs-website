import { useState } from "react";

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light primary-color">
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
              <li className="nav-item active">
                <a
                  className="nav-link"
                  href="/?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/nba?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  NBA
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/nhl?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  NHL
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/mlb?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  MLB
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/howto?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  Howto
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/tools?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  Tools
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/temperature?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  Temperature
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/lead?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  Lead
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/payment?utm_source=dummy_source&utm_medium=dummy_medium&utm_campaign=dummy_campaign"
                >
                  Payment
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/spotifyauth">
                  SpotifyAuth
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
