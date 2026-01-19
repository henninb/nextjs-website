import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brian Henning - Solutions Engineer",
  description:
    "Solutions engineer based in Minneapolis specializing in software development, technical sales, and cybersecurity.",
  keywords: [
    "solutions engineer",
    "software development",
    "technical sales",
    "cybersecurity",
    "Minneapolis",
    "Brian Henning",
  ],
  openGraph: {
    title: "Brian Henning - Solutions Engineer",
    description:
      "Solutions engineer based in Minneapolis specializing in software development, technical sales, and cybersecurity.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brian Henning - Solutions Engineer",
    description:
      "Solutions engineer based in Minneapolis specializing in software development, technical sales, and cybersecurity.",
  },
};

export default function HomePage() {
  return (
    <div>
      <main>
        <div>
          {/* Intro Section */}
          <section className="intro" id="home">
            <h1 className="section__title section__title--intro">
              Hi, I am <strong>Brian Henning</strong>
            </h1>
            <p className="section__subtitle section__subtitle--intro">
              solutions engineer
            </p>
            <img
              src="img/photo-brian-henning-nobackground.png"
              alt="Brian Henning smiling"
              className="intro__img"
            />
          </section>

          {/* Services Section */}
          <section className="my-services" id="services">
            <h2 className="section__title section__title--services">
              What I do
            </h2>
            <div className="services">
              <div className="service">
                <h3 className="service-header">
                  <b>Software Development</b>
                </h3>
                <p>
                  As a software developer, I've led and contributed to projects
                  involving diverse programming languages and technologies,
                  developing robust solutions, enhancing efficiency and security
                  through system migrations, and innovating within the tech
                  landscape. Adapting to technological shifts, mastering new
                  skills, and exceeding technical and security standards in
                  today's digital world drive my journey from engineering to
                  leading security-focused initiatives.
                </p>
              </div>

              <div className="service">
                <h3 className="service-header">
                  <b>Technical Sales</b>
                </h3>
                <p>
                  In technical sales, I merge deep technical knowledge with
                  strategic sales techniques to meet client needs. Understanding
                  technology intricacies and effectively communicating benefits
                  to non-technical stakeholders allows me to close deals and
                  build lasting client relationships. My success stems from
                  expertise, adaptability, and genuine commitment to solving
                  customer problems.
                </p>
              </div>

              <div className="service">
                <h3 className="service-header">
                  <b>Cyber Security</b>
                </h3>
                <p>
                  In my cybersecurity role, I lead initiatives to improve system
                  security, identifying vulnerabilities and implementing
                  strategic defenses. Efforts have boosted secure coding
                  practices and security metrics, showing dedication to
                  safeguarding information. Emphasizing proactive
                  problem-solving and deep cybersecurity understanding ensures
                  compliance and protection against evolving threats.
                </p>
              </div>
            </div>

            <a href="#work" className="btn">
              My Work
            </a>
          </section>

          {/* About Section */}
          <section className="about-me" id="about">
            <h2 className="section__title section__title--about">Who I am</h2>
            <p className="section__subtitle section__subtitle--about">
              Technical seller based out of Minneapolis
            </p>

            <div className="about-me__body">
              <p>
                I'm Brian Henning, a seasoned professional in the realms of
                software development, sales, and cybersecurity. My journey has
                been marked by a dedication to creating innovative software
                solutions, a knack for strategically closing sales, and a
                commitment to enhancing cybersecurity measures. My role as a
                solutions engineer has allowed me to blend my technical
                expertise with my ability to understand and meet customer needs,
                driving sustainable growth and securing key deals. In
                cybersecurity, I've led initiatives that significantly bolstered
                system security, showcasing my ability to navigate complex
                challenges and implement robust protections. This blend of
                skills underscores my holistic approach to tackling today's
                digital challenges, aiming to contribute meaningfully to the
                success of the organizations I work with.
              </p>
            </div>

            <img
              src="img/brian-with-maggie.jpg"
              alt="Brian with one of his 3 daughters"
              className="about-me__img"
            />
          </section>

          {/* Portfolio Section */}
          <section className="my-work" id="work">
            <h2 className="section__title section__title--work">My work</h2>
            <p className="section__subtitle section__subtitle--work">
              A selection of my range of work
            </p>

            <div className="portfolio">
              <a href="portfolio-item.html" className="portfolio__item">
                <img
                  src="img/portfolio-01.jpg"
                  alt="React Finance Application"
                  className="portfolio__img"
                />
              </a>

              <a href="portfolio-item.html" className="portfolio__item">
                <img
                  src="img/portfolio-02.jpg"
                  alt="Proxmox Server"
                  className="portfolio__img"
                />
              </a>

              <a href="pfsense-portfolio-item.html" className="portfolio__item">
                <img
                  src="img/portfolio-03.jpg"
                  alt="pFsense Router"
                  className="portfolio__img"
                />
              </a>

              <a
                href="https://github.com/henninb/llm-gateway"
                className="portfolio__item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="img/portfolio-llm-gateway.png"
                  alt="LLM Gateway - Unified AI Model API"
                  className="portfolio__img"
                />
              </a>

              <a
                href="https://github.com/henninb/flutter-cribbage"
                className="portfolio__item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="img/portfolio-flutter-cribbage.png"
                  alt="Flutter Cribbage - Cross-Platform Card Game"
                  className="portfolio__img"
                />
              </a>

              <a
                href="https://github.com/henninb/flutter-fivehundred"
                className="portfolio__item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="img/portfolio-flutter-fivehundred.png"
                  alt="Flutter Five Hundred - Classic Trick-Taking Game"
                  className="portfolio__img"
                />
              </a>

              <a
                href="https://github.com/henninb/raspi-finance-endpoint"
                className="portfolio__item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="img/portfolio-finance-endpoint.png"
                  alt="Finance Endpoint API"
                  className="portfolio__img"
                />
              </a>

              <a href="portfolio-item.html" className="portfolio__item">
                <img
                  src="img/portfolio-08.jpg"
                  alt="item8"
                  className="portfolio__img"
                />
              </a>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <a href="mailto:henninb@gmail.com" className="footer__link">
              henninb@gmail.com
            </a>
            <ul className="social-list">
              <li className="social-list__item">
                <a
                  className="social-list__link"
                  href="https://codepen.io/henninb/projects"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-codepen"></i>
                </a>
              </li>
              <li className="social-list__item">
                <a
                  className="social-list__link"
                  href="https://dribbble.com/henninb"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-dribbble"></i>
                </a>
              </li>
              <li className="social-list__item">
                <a
                  className="social-list__link"
                  href="https://www.linkedin.com/in/brian-henning-9213bb5/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-linkedin"></i>
                </a>
              </li>
              <li className="social-list__item">
                <a
                  className="social-list__link"
                  href="https://twitter.com/henninb"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-twitter"></i>
                </a>
              </li>
              <li className="social-list__item">
                <a
                  className="social-list__link"
                  href="https://github.com/henninb"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-github"></i>
                </a>
              </li>
              <li className="social-list__item">
                <a
                  className="social-list__link"
                  href="https://gitlab.com/henninb"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-gitlab"></i>
                </a>
              </li>
              <li className="social-list__item">
                <a
                  className="social-list__link"
                  href="https://reddit.com/user/z037640"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-reddit"></i>
                </a>
              </li>
            </ul>
          </footer>
        </div>
      </main>
    </div>
  );
}
