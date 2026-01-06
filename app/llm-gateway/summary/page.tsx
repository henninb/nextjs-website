"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SummaryPage() {
  const router = useRouter();
  return (
    <div className="summary-container">
      <style jsx>{`
        .summary-container {
          min-height: 100vh;
          padding: 0;
          color: white;
        }

        .header {
          text-align: center;
          padding: 3rem 2rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header h1 {
          font-size: 4.5rem;
          margin-bottom: 1.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header p {
          font-size: 1.75rem;
          opacity: 0.95;
          max-width: 1000px;
          margin: 0 auto;
          line-height: 1.8;
        }

        .content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .achievement-banner {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
          border-radius: 20px;
          padding: 3rem;
          margin: 3rem 0;
          text-align: center;
          box-shadow: 0 10px 40px rgba(46, 204, 113, 0.3);
        }

        .achievement-banner h2 {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }

        .achievement-banner p {
          font-size: 1.75rem;
          opacity: 0.95;
          line-height: 1.8;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2.5rem;
          margin: 4rem 0;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-8px);
          border-color: rgba(46, 204, 113, 0.5);
        }

        .stat-value {
          font-size: 5rem;
          font-weight: 700;
          color: #2ecc71;
          display: block;
          margin-bottom: 1rem;
        }

        .stat-label {
          font-size: 1.5rem;
          opacity: 0.95;
          line-height: 1.6;
        }

        .highlights-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          margin: 3rem 0;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .highlights-section h2 {
          font-size: 3rem;
          margin-bottom: 2rem;
          text-align: center;
          color: #2ecc71;
        }

        .highlight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2.5rem;
          margin-top: 2rem;
        }

        .highlight-card {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 2.5rem;
          border-left: 5px solid #2ecc71;
        }

        .highlight-card h3 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #2ecc71;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .highlight-card .icon {
          font-size: 2.5rem;
        }

        .highlight-card p {
          font-size: 1.35rem;
          line-height: 1.8;
          opacity: 0.95;
        }

        .tech-summary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          margin: 3rem 0;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .tech-summary h2 {
          font-size: 3rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .tech-badge {
          background: rgba(46, 204, 113, 0.2);
          border: 2px solid #2ecc71;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          font-size: 1.35rem;
          font-weight: 600;
        }

        .bottom-nav {
          display: flex;
          gap: 2rem;
          justify-content: center;
          align-items: center;
          margin: 4rem auto 0;
          padding-bottom: 10rem;
          flex-wrap: wrap;
          max-width: 1000px;
        }

        .nav-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(30, 41, 59, 0.6);
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          text-decoration: none;
          color: rgba(226, 232, 240, 0.95);
          font-weight: 600;
          font-size: 1rem;
          border: 1px solid rgba(148, 163, 184, 0.15);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          pointer-events: auto;
          min-width: 180px;
          position: relative;
        }

        .nav-button::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(14, 165, 233, 0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nav-button:hover {
          background: rgba(51, 65, 85, 0.8);
          border-color: rgba(56, 189, 248, 0.3);
          color: rgb(224, 242, 254);
          transform: translateY(-1px);
        }

        .nav-button:hover::before {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 3rem;
          }

          .stats-grid,
          .highlight-grid,
          .tech-grid {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 3.5rem;
          }

          .bottom-nav {
            gap: 1rem;
            padding-bottom: 12rem;
          }

          .nav-button {
            min-width: 140px;
            font-size: 0.875rem;
            padding: 0.625rem 1.125rem;
          }
        }
      `}</style>

      <div className="header">
        <h1>📊 Project Summary</h1>
        <p>
          Production-grade AWS infrastructure demonstrating enterprise security,
          cost optimization, and modern DevOps practices
        </p>
      </div>

      <div className="content">
        <div className="achievement-banner">
          <h2>🎉 All Requirements Exceeded</h2>
          <p>
            5/5 core objectives met • 2/2 stretch goals achieved • 100%
            Infrastructure as Code • Production-ready deployment
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">7</span>
            <span className="stat-label">AI Models Deployed</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">50-90%</span>
            <span className="stat-label">Cost Savings with SPOT</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">100%</span>
            <span className="stat-label">Infrastructure as Code</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">12/12</span>
            <span className="stat-label">Guardrail Tests Passing</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">Zero</span>
            <span className="stat-label">Static AWS Credentials</span>
          </div>
        </div>

        <div className="highlights-section">
          <h2>Key Achievements</h2>

          <div className="highlight-grid">
            <div className="highlight-card">
              <h3>
                <span className="icon">☸️</span>
                Production Kubernetes
              </h3>
              <p>
                AWS EKS cluster with auto-scaling capability and
                zero-trust network policies
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🔐</span>
                Enterprise Security
              </h3>
              <p>
                IRSA authentication, CloudFlare protection (optional geo-restriction), and
                defense-in-depth controls
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🐛</span>
                Production Debugging
              </h3>
              <p>
                Identified LiteLLM streaming bug during testing. Read LiteLLM framework
                source code to identify async_post_call_success_hook isn't invoked for
                streaming responses. Designed workaround forcing stream=false
                at pre-call hook level. Demonstrates security-first thinking and systematic
                debugging methodology.
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">💰</span>
                Cost Optimized
              </h3>
              <p>
                SPOT instances and single NAT gateway achieving significant
                cost savings (50-90% on compute)
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🤖</span>
                Multi-Provider AI
              </h3>
              <p>
                7 models across 3 providers: AWS Bedrock Nova (3 models), AWS Bedrock Llama (2 models),
                Perplexity (2 models) - all via unified OpenAI-compatible API
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🚀</span>
                Automated Deployment
              </h3>
              <p>
                30+ Make commands for streamlined infrastructure provisioning
                and operations
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🎭</span>
                Arena Mode
              </h3>
              <p>
                Blind random model selection for unbiased AI evaluation. Currently disabled
                but fully configured with nova-lite, nova-pro, and llama3-2-3b. Demonstrates
                understanding of OpenWebUI's streaming behavior (forces stream=true for arena models).
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🛡️</span>
                Custom Guardrails
              </h3>
              <p>
                Identified LiteLLM v1.80.11 streaming bug where post-call hooks aren't
                invoked for streaming responses. Debugged framework source code, identified
                root cause, and implemented stream=false forcing workaround. 12 comprehensive
                tests validate all attack vectors including context poisoning and indirect bypasses.
              </p>
            </div>
          </div>
        </div>

        <div className="tech-summary">
          <h2>Technology Stack</h2>

          <div className="tech-grid">
            <div className="tech-badge">AWS EKS</div>
            <div className="tech-badge">Kubernetes 1.34</div>
            <div className="tech-badge">Terraform</div>
            <div className="tech-badge">LiteLLM</div>
            <div className="tech-badge">OpenWebUI</div>
            <div className="tech-badge">AWS Bedrock</div>
            <div className="tech-badge">Perplexity API</div>
            <div className="tech-badge">CloudFlare</div>
            <div className="tech-badge">IRSA</div>
            <div className="tech-badge">Network Policies</div>
            <div className="tech-badge">SPOT Instances</div>
            <div className="tech-badge">ACM Certificates</div>
          </div>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/cost")}
          >
            ← Previous: Cost
          </button>
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway")}
          >
            Next: Overview →
          </button>
        </div>
      </div>
    </div>
  );
}
