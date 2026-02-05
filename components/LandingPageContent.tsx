"use client";

import React from "react";
import Link from "next/link";
import ShieldIcon from "./svg/ShieldIcon";
import LockIcon from "./svg/LockIcon";
import "../styles/landing.css";

export default function LandingPageContent() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero__scan" />
        <ShieldIcon className="landing-hero__shield" />
        <h1 className="landing-hero__headline">
          Your Site Is <span>Protected</span>
        </h1>
        <p className="landing-hero__subtitle">
          Advanced bot detection and human verification keeping this site safe
          from automated threats.
        </p>
        <div className="landing-hero__terminal">
          <span>$ status: all systems secured</span>
          <span className="landing-hero__terminal-cursor" />
        </div>
      </section>

      {/* Quick Links */}
      <section className="landing-section">
        <h2 className="landing-section__title">
          Explore <span>Features</span>
        </h2>
        <div className="landing-links">
          <Link href="/tools" className="landing-link">
            <div className="landing-link__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <h3 className="landing-link__title">Tools</h3>
            <p className="landing-link__desc">Developer tools and utilities</p>
            <span className="landing-link__arrow">&rarr;</span>
          </Link>
          <Link href="/temperature" className="landing-link">
            <div className="landing-link__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
              </svg>
            </div>
            <h3 className="landing-link__title">Temperature</h3>
            <p className="landing-link__desc">Conversion and live weather</p>
            <span className="landing-link__arrow">&rarr;</span>
          </Link>
          <Link href="/lead" className="landing-link">
            <div className="landing-link__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h3 className="landing-link__title">Lead</h3>
            <p className="landing-link__desc">Vehicle lead form with VIN lookup</p>
            <span className="landing-link__arrow">&rarr;</span>
          </Link>
          <Link href="/payment" className="landing-link">
            <div className="landing-link__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h3 className="landing-link__title">Payment</h3>
            <p className="landing-link__desc">Secure payment processing</p>
            <span className="landing-link__arrow">&rarr;</span>
          </Link>
          <Link href="/watch" className="landing-link">
            <div className="landing-link__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <h3 className="landing-link__title">Watch</h3>
            <p className="landing-link__desc">Video player with analytics</p>
            <span className="landing-link__arrow">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* What Is Bot Protection */}
      <section className="landing-section">
        <h2 className="landing-section__title">
          What Is <span>Bot Protection</span>?
        </h2>
        <div className="landing-cards">
          <div className="landing-card">
            <LockIcon className="landing-card__icon" />
            <h3 className="landing-card__title">Bot Detection</h3>
            <p className="landing-card__text">
              Behavioral analysis and fingerprinting distinguish real users from
              automated scripts, blocking malicious bots before they can act.
            </p>
          </div>
          <div className="landing-card">
            <LockIcon className="landing-card__icon" />
            <h3 className="landing-card__title">Human Verification</h3>
            <p className="landing-card__text">
              Invisible challenges verify legitimate visitors without disrupting
              the user experience, keeping friction low and security high.
            </p>
          </div>
          <div className="landing-card">
            <LockIcon className="landing-card__icon" />
            <h3 className="landing-card__title">Threat Intelligence</h3>
            <p className="landing-card__text">
              Real-time threat data from global networks identifies known attack
              patterns and emerging threats before they reach your application.
            </p>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="landing-section">
        <h2 className="landing-section__title">
          Why It <span>Matters</span>
        </h2>
        <div className="landing-stats">
          <div className="landing-stat">
            <div className="landing-stat__number">40%+</div>
            <div className="landing-stat__label">
              Of all internet traffic is generated by bots, many of them
              malicious.
            </div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat__number">$6T</div>
            <div className="landing-stat__label">
              Annual cost of cybercrime globally, with credential stuffing and
              account takeover on the rise.
            </div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat__number">95%</div>
            <div className="landing-stat__label">
              Of credential stuffing attacks use automated bots to test stolen
              credentials at scale.
            </div>
          </div>
        </div>
      </section>

      {/* How This Site Is Protected */}
      <section className="landing-section">
        <h2 className="landing-section__title">
          How This Site Is <span>Protected</span>
        </h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step__number">1</div>
            <h3 className="landing-step__title">Risk Scoring</h3>
            <p className="landing-step__text">
              Machine learning models analyze collected data in real time to
              produce a risk score for each visitor.
            </p>
          </div>
          <div className="landing-step">
            <div className="landing-step__number">2</div>
            <h3 className="landing-step__title">Challenge or Allow</h3>
            <p className="landing-step__text">
              Low-risk visitors pass through seamlessly. Suspicious traffic
              receives an invisible challenge or is blocked.
            </p>
          </div>
          <div className="landing-step">
            <div className="landing-step__number">3</div>
            <h3 className="landing-step__title">Continuous Monitoring</h3>
            <p className="landing-step__text">
              Ongoing session analysis detects anomalies and adapts defenses as
              threat patterns evolve.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p className="landing-footer__text">
          <span>bhenning.com</span> &mdash; secured and monitored
        </p>
      </footer>
    </div>
  );
}
